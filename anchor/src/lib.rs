use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_lang::solana_program::system_instruction;

// Replace this with your deployed program ID after running 'anchor build'
declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

// The address you provided for payments
const TREASURY_PUBKEY: &str = "9o77AkThGHNhNDeowM943dNsCck71VTUeFwBxq3RaGjn";
// Price for the mint (e.g., 0.1 SOL)
const MINT_PRICE: u64 = 100_000_000;

#[program]
pub mod seeker_airdrop_mint {
    use super::*;

    pub fn mint_proof_of_airdrop(ctx: Context<MintProof>) -> Result<()> {
        // 1. Verify Payment Logic
        // We manually invoke the system program to transfer SOL from payer to treasury
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &ctx.accounts.treasury.key(),
            MINT_PRICE,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.payer.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        // 2. Mint the Proof Token
        // The program signs for the minting using a PDA (Program Derived Address)
        let seeds = &["mint_authority".as_bytes(), &[ctx.bumps.mint_authority]];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::mint_to(cpi_ctx, 1)?; // Mint exactly 1 token (NFT style)

        msg!("Payment of {} lamports received. Proof minted.", MINT_PRICE);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintProof<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    // Verification: Ensure the treasury passed is the one hardcoded
    #[account(
        mut,
        address = TREASURY_PUBKEY.parse::<Pubkey>().unwrap() @ ErrorCode::InvalidTreasury
    )]
    /// CHECK: This is the payment recipient, verified by address constraint above
    pub treasury: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = ["proof_mint".as_bytes()],
        bump
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: We use a PDA as the mint authority so the program can mint
    #[account(
        seeds = ["mint_authority".as_bytes()],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub destination: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The treasury address is incorrect.")]
    InvalidTreasury,
}
