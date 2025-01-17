import { Program, ProgramError, Provider } from '@heavy-duty/anchor';
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import { assert } from 'chai';
import { Bulldozer, IDL } from '../target/types/bulldozer';
import { BULLDOZER_PROGRAM_ID } from './utils';

describe('workspace', () => {
  const program = new Program<Bulldozer>(
    IDL,
    BULLDOZER_PROGRAM_ID,
    Provider.env()
  );
  const workspace = Keypair.generate();
  const newUser = Keypair.generate();
  let userPublicKey: PublicKey;
  let newUserPublicKey: PublicKey;
  let collaboratorPublicKey: PublicKey;
  let budgetPublicKey: PublicKey;

  before(async () => {
    [userPublicKey] = await PublicKey.findProgramAddress(
      [
        Buffer.from('user', 'utf8'),
        program.provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    [newUserPublicKey] = await PublicKey.findProgramAddress(
      [Buffer.from('user', 'utf8'), newUser.publicKey.toBuffer()],
      program.programId
    );
    [collaboratorPublicKey] = await PublicKey.findProgramAddress(
      [
        Buffer.from('collaborator', 'utf8'),
        workspace.publicKey.toBuffer(),
        userPublicKey.toBuffer(),
      ],
      program.programId
    );
    [budgetPublicKey] = await PublicKey.findProgramAddress(
      [Buffer.from('budget', 'utf8'), workspace.publicKey.toBuffer()],
      program.programId
    );
    try {
      await program.methods
        .createUser()
        .accounts({
          authority: program.provider.wallet.publicKey,
        })
        .rpc();
    } catch (error) {}

    await program.methods
      .createUser()
      .accounts({
        authority: newUser.publicKey,
      })
      .signers([newUser])
      .preInstructions([
        SystemProgram.transfer({
          fromPubkey: program.provider.wallet.publicKey,
          toPubkey: newUser.publicKey,
          lamports: LAMPORTS_PER_SOL,
        }),
      ])
      .rpc();
  });

  it('should create account', async () => {
    // arrange
    const workspaceName = 'my-app';
    // act
    await program.methods
      .createWorkspace({
        name: workspaceName,
      })
      .accounts({
        authority: program.provider.wallet.publicKey,
        workspace: workspace.publicKey,
      })
      .postInstructions([
        SystemProgram.transfer({
          fromPubkey: program.provider.wallet.publicKey,
          toPubkey: budgetPublicKey,
          lamports: LAMPORTS_PER_SOL,
        }),
      ])
      .signers([workspace])
      .rpc();
    // assert
    const account = await program.account.workspace.fetch(workspace.publicKey);
    assert.ok(account.authority.equals(program.provider.wallet.publicKey));
    assert.equal(account.name, workspaceName);
    assert.ok(account.createdAt.eq(account.updatedAt));
  });

  it('should update account', async () => {
    // arrange
    const workspaceName = 'my-app2';
    // act
    await program.methods
      .updateWorkspace({ name: workspaceName })
      .accounts({
        authority: program.provider.wallet.publicKey,
        workspace: workspace.publicKey,
      })
      .rpc();
    // assert
    const account = await program.account.workspace.fetch(workspace.publicKey);
    assert.ok(account.createdAt.lte(account.updatedAt));
    assert.equal(account.name, workspaceName);
  });

  it('should delete account', async () => {
    // act
    await program.methods
      .deleteWorkspace()
      .accounts({
        authority: program.provider.wallet.publicKey,
        workspace: workspace.publicKey,
      })
      .rpc();
    // assert
    const account = await program.account.workspace.fetchNullable(
      workspace.publicKey
    );
    assert.equal(account, null);
  });

  it('should fail when deleting workspace with applications', async () => {
    // arrange
    const newWorkspaceName = 'sample';
    const newWorkspace = Keypair.generate();
    const applicationName = 'sample';
    const application = Keypair.generate();
    const [newBudgetPublicKey] = await PublicKey.findProgramAddress(
      [Buffer.from('budget', 'utf8'), newWorkspace.publicKey.toBuffer()],
      program.programId
    );
    let error: ProgramError | null = null;
    // act
    try {
      await program.methods
        .createWorkspace({
          name: newWorkspaceName,
        })
        .accounts({
          // This is temporal since anchor doesn't populate pda from a defined type argument
          workspace: newWorkspace.publicKey,
          authority: program.provider.wallet.publicKey,
          user: userPublicKey,
        })
        .signers([newWorkspace])
        .postInstructions([
          SystemProgram.transfer({
            fromPubkey: program.provider.wallet.publicKey,
            toPubkey: newBudgetPublicKey,
            lamports: LAMPORTS_PER_SOL,
          }),
        ])
        .rpc();
      await program.methods
        .createApplication({ name: applicationName })
        .accounts({
          authority: program.provider.wallet.publicKey,
          workspace: newWorkspace.publicKey,
          application: application.publicKey,
        })
        .signers([application])
        .rpc();
      await program.methods
        .deleteWorkspace()
        .accounts({
          authority: program.provider.wallet.publicKey,
          workspace: newWorkspace.publicKey,
        })
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error?.code, 6024);
  });

  it('should fail when deleting workspace with collaborators', async () => {
    // arrange
    const newWorkspaceName = 'sample';
    const newWorkspace = Keypair.generate();
    let error: ProgramError | null = null;
    // act
    await program.methods
      .createWorkspace({
        name: newWorkspaceName,
      })
      .accounts({
        workspace: newWorkspace.publicKey,
        authority: program.provider.wallet.publicKey,
      })
      .signers([newWorkspace])
      .rpc();

    try {
      await program.methods
        .createCollaborator()
        .accounts({
          workspace: newWorkspace.publicKey,
          user: newUserPublicKey,
          authority: program.provider.wallet.publicKey,
        })
        .rpc();

      await program.methods
        .deleteWorkspace()
        .accounts({
          authority: program.provider.wallet.publicKey,
          workspace: newWorkspace.publicKey,
        })
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error?.code, 6025);
  });

  it('should fail when user is not a collaborator', async () => {
    // arrange
    const newWorkspaceName = 'sample';
    const newUser = Keypair.generate();
    let error: ProgramError | null = null;
    // act
    try {
      await program.methods
        .updateWorkspace({ name: newWorkspaceName })
        .accounts({
          authority: newUser.publicKey,
          workspace: workspace.publicKey,
        })
        .signers([newUser])
        .preInstructions([
          SystemProgram.transfer({
            fromPubkey: program.provider.wallet.publicKey,
            toPubkey: newUser.publicKey,
            lamports: LAMPORTS_PER_SOL,
          }),
        ])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error?.code, 3012);
  });

  it('should fail when user is not an admin collaborator', async () => {
    // arrange
    const newWorkspace = Keypair.generate();
    const newWorkspaceName = 'sample';
    const newUser = Keypair.generate();
    let error: ProgramError | null = null;
    // act
    const [newUserPublicKey] = await PublicKey.findProgramAddress(
      [Buffer.from('user', 'utf8'), newUser.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .createUser()
      .accounts({
        authority: newUser.publicKey,
      })
      .signers([newUser])
      .preInstructions([
        SystemProgram.transfer({
          fromPubkey: program.provider.wallet.publicKey,
          toPubkey: newUser.publicKey,
          lamports: LAMPORTS_PER_SOL,
        }),
      ])
      .rpc();
    await program.methods
      .createWorkspace({
        name: newWorkspaceName,
      })
      .accounts({
        authority: program.provider.wallet.publicKey,
        workspace: newWorkspace.publicKey,
      })
      .signers([newWorkspace])
      .rpc();
    await program.methods
      .requestCollaboratorStatus()
      .accounts({
        authority: newUser.publicKey,
        user: newUserPublicKey,
        workspace: newWorkspace.publicKey,
      })
      .signers([newUser])
      .rpc();
    try {
      await program.methods
        .updateWorkspace({ name: newWorkspaceName })
        .accounts({
          authority: newUser.publicKey,
          workspace: newWorkspace.publicKey,
        })
        .signers([newUser])
        .rpc();
    } catch (err) {
      error = err as ProgramError;
    }
    // assert
    assert.equal(error?.code, 6045);
  });
});
