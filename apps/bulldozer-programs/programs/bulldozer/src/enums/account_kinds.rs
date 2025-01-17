use crate::errors::ErrorCode;
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum AccountKinds {
  Document { id: u8, collection: Pubkey },
  Signer { id: u8 },
}

impl AccountKinds {
  pub fn create(kind: u8, collection: Option<Pubkey>) -> Result<AccountKinds> {
    match (kind, collection) {
      (0, Some(collection)) => Ok(AccountKinds::Document {
        id: 0,
        collection: collection,
      }),
      (1, _) => Ok(AccountKinds::Signer { id: 1 }),
      _ => Err(error!(ErrorCode::InvalidAccountKind)),
    }
  }
}
