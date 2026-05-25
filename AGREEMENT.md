# LOAN AGREEMENT

**Agreement ID:** `{{agreementId}}`  
**Date:** `{{agreementDate}}`  

---

## 1. PARTIES

**Lender:** `{{lenderName}}` (hereinafter referred to as the "Lender")  

**Borrower:** `{{borrowerName}}`  
- Address: `{{borrowerAddress}}`  
- Contact: `{{borrowerContact}}`  
- Email: `{{borrowerEmail}}`  

**Debt Reference:** `{{debtName}}` (Debt ID: `{{debtId}}`)

---

## 2. LOAN DETAILS

| Item                     | Value                                  |
|--------------------------|----------------------------------------|
| Principal Amount         | `{{principalAmount}}` {{currency}}     |
| Annual Interest Rate     | `{{interestRate}}` %                   |
| Penalty Rate (per annum) | `{{penaltyRate}}` % (if applicable)    |
| Due Date                 | `{{dueDate}}`                          |
| Purpose of Loan          | `{{purpose}}`                          |

---

## 3. INTEREST ACCRUAL (MONTHLY ANNIVERSARY)

Interest shall accrue on the outstanding principal balance **every month on the same day as the loan start date** (the “Anniversary Day”).  

- **Example:** If the loan start date is `{{loanStartDate}}`, interest will be added on the `{{anniversaryDay}}` of each subsequent month.
- If the Anniversary Day does not exist in a given month (e.g., 31st in February), interest will be added on the **last day** of that month.
- Interest is calculated using the **simple interest formula**:  

  `Interest = Outstanding Principal × (Annual Rate / 12)`  

  (i.e., one‑twelfth of the annual rate per full month).
- **No interest** is charged during the first month after disbursement (grace period). First accrual occurs on the first Anniversary Day following the start date.
- The Lender may update the outstanding balance by adding accrued interest at each anniversary. The updated balance becomes the new principal for future interest calculations (semi‑annual compounding if more than one month passes without payment).

---

## 4. REPAYMENT TERMS

- The Borrower agrees to repay the total outstanding balance (principal plus accrued interest) **on or before the Due Date** stated above.
- **Partial payments** are allowed at any time and will be applied first to any accrued interest, then to the principal.
- Any amount remaining after the Due Date will be subject to penalty charges (see Section 5).

---

## 5. PENALTIES FOR LATE PAYMENT

If the Borrower fails to pay the full outstanding balance by the Due Date:

- A **penalty** equal to `{{penaltyRate}}` % per annum of the overdue amount will be added **daily** from the day after the Due Date until full payment is received.
- The Lender may also take legal action to recover the debt, and all collection costs shall be borne by the Borrower.

---

## 6. PREPAYMENT

The Borrower may prepay part or all of the outstanding balance at any time without penalty. Prepayments reduce the principal and future interest accruals.

---

## 7. DEFAULT

The loan will be considered in default if:

- Any payment is overdue by more than 30 days, or
- The Borrower becomes bankrupt or insolvent, or
- The Borrower provides false information.

Upon default, the entire outstanding balance (principal + accrued interest + penalties) becomes immediately due and payable.

---

## 8. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of the Republic of the Philippines.

---

## 9. ENTIRE AGREEMENT

This document constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior agreements, whether written or oral.

---

## 10. SIGNATURES

**Lender:**  
Signature: ____________________  
Name:   `{{lenderName}}`  
Date:   `{{signatureDate}}`

**Borrower:**  
Signature: ____________________  
Name:   `{{borrowerName}}`  
Date:   `{{signatureDate}}`