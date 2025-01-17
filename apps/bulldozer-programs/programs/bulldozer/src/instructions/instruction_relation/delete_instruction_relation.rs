use crate::collections::{
  Budget, Collaborator, Instruction, InstructionAccount, InstructionAccountStats,
  InstructionRelation, User, Workspace,
};
use crate::enums::CollaboratorStatus;
use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DeleteInstructionRelation<'info> {
  pub authority: Signer<'info>,
  pub workspace: Box<Account<'info, Workspace>>,
  #[account(
    constraint = instruction.workspace == workspace.key() @ ErrorCode::InstructionDoesNotBelongToWorkspace
  )]
  pub instruction: Box<Account<'info, Instruction>>,
  #[account(
    constraint = from.workspace == workspace.key() @ ErrorCode::InstructionAccountDoesNotBelongToWorkspace,
    constraint = from.instruction == instruction.key() @ ErrorCode::InstructionAccountDoesNotBelongToInstruction,
  )]
  pub from: Box<Account<'info, InstructionAccount>>,
  #[account(
    constraint = to.workspace == workspace.key() @ ErrorCode::InstructionAccountDoesNotBelongToWorkspace,
    constraint = to.instruction == instruction.key() @ ErrorCode::InstructionAccountDoesNotBelongToInstruction,
  )]
  pub to: Box<Account<'info, InstructionAccount>>,
  #[account(
    mut,
    close = authority,
    seeds = [
      b"instruction_relation".as_ref(),
      from.key().as_ref(),
      to.key().as_ref()
    ],
    bump = relation.bump
  )]
  pub relation: Account<'info, InstructionRelation>,
  #[account(
    seeds = [
      b"user".as_ref(),
      authority.key().as_ref(),
    ],
    bump = user.bump
  )]
  pub user: Box<Account<'info, User>>,
  #[account(
    seeds = [
      b"collaborator".as_ref(),
      workspace.key().as_ref(),
      user.key().as_ref(),
    ],
    bump = collaborator.bump,
    constraint = collaborator.status == CollaboratorStatus::Approved { id: 1 } @ ErrorCode::CollaboratorStatusNotApproved,
  )]
  pub collaborator: Box<Account<'info, Collaborator>>,
  #[account(
    mut,
    seeds = [
      b"budget".as_ref(),
      workspace.key().as_ref(),
    ],
    bump = budget.bump,
  )]
  pub budget: Box<Account<'info, Budget>>,
  #[account(
    mut,
    seeds = [
      b"instruction_account_stats".as_ref(),
      from.key().as_ref()
    ],
    bump = from.instruction_account_stats_bump
  )]
  pub from_stats: Box<Account<'info, InstructionAccountStats>>,
  #[account(
    mut,
    seeds = [
      b"instruction_account_stats".as_ref(),
      to.key().as_ref()
    ],
    bump = to.instruction_account_stats_bump
  )]
  pub to_stats: Box<Account<'info, InstructionAccountStats>>,
}

pub fn handle(ctx: Context<DeleteInstructionRelation>) -> Result<()> {
  msg!("Delete instruction relation");
  ctx.accounts.from_stats.decrease_relation_quantity();
  ctx.accounts.to_stats.decrease_relation_quantity();
  Ok(())
}
