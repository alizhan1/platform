use crate::enums::{AccountKinds, AccountModifiers};
use anchor_lang::prelude::*;

#[account]
pub struct InstructionAccountStats {
  pub quantity_of_relations: u8,
}

impl InstructionAccountStats {
  pub fn initialize(&mut self) -> () {
    self.quantity_of_relations = 0;
  }

  pub fn increase_relation_quantity(&mut self) -> () {
    self.quantity_of_relations += 1;
  }

  pub fn decrease_relation_quantity(&mut self) -> () {
    self.quantity_of_relations -= 1;
  }

  pub fn space() -> usize {
    // discriminator + quantity of relations
    8 + 1
  }
}

#[account]
pub struct InstructionAccount {
  pub authority: Pubkey,
  pub workspace: Pubkey,
  pub application: Pubkey,
  pub instruction: Pubkey,
  pub name: String,
  pub kind: AccountKinds,
  pub modifier: Option<AccountModifiers>,
  pub collection: Option<Pubkey>,
  pub payer: Option<Pubkey>,
  pub close: Option<Pubkey>,
  pub space: Option<u16>,
  pub created_at: i64,
  pub updated_at: i64,
  pub instruction_account_stats_bump: u8,
}

impl InstructionAccount {
  pub fn initialize(
    &mut self,
    name: String,
    authority: Pubkey,
    workspace: Pubkey,
    application: Pubkey,
    instruction: Pubkey,
    kind: AccountKinds,
    modifier: Option<AccountModifiers>,
    instruction_account_stats_bump: u8,
  ) -> () {
    self.authority = authority;
    self.workspace = workspace;
    self.application = application;
    self.instruction = instruction;
    self.name = name;
    self.kind = kind;
    self.modifier = modifier;
    self.instruction_account_stats_bump = instruction_account_stats_bump;
  }

  pub fn rename(&mut self, name: String) -> () {
    self.name = name;
  }

  pub fn change_settings(&mut self, kind: AccountKinds, modifier: Option<AccountModifiers>) -> () {
    self.kind = kind;
    self.modifier = modifier;
  }

  pub fn initialize_timestamp(&mut self) -> Result<()> {
    self.created_at = Clock::get()?.unix_timestamp;
    self.updated_at = Clock::get()?.unix_timestamp;
    Ok(())
  }

  pub fn bump_timestamp(&mut self) -> Result<()> {
    self.updated_at = Clock::get()?.unix_timestamp;
    Ok(())
  }

  pub fn space() -> usize {
    // discriminator + authority + workspace + application
    // instruction + name (size 32 + 4 ?) + kind + modifier
    // collection + payer + close + space + stats bump
    // created at + updated at
    8 + 32 + 32 + 32 + 32 + 36 + 2 + 2 + 33 + 33 + 33 + 3 + 1 + 8 + 8
  }
}
