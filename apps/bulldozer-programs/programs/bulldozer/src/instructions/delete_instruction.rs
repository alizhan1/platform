use anchor_lang::prelude::*;
use crate::collections::{Instruction};

#[derive(Accounts)]
pub struct DeleteInstruction<'info> {
    #[account(mut, has_one = authority, close = authority)]
    pub instruction: Account<'info, Instruction>,
    pub authority: Signer<'info>,
}

pub fn handler(_ctx: Context<DeleteInstruction>) -> ProgramResult {
    msg!("Delete instruction");
    Ok(())
}