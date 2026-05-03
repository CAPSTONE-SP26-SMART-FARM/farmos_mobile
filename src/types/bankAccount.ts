export type DoctorBankAccount = {
  id: string
  doctorId: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  branch: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateBankAccountBody = {
  bankCode: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  branch?: string
  isDefault?: boolean
}

export type UpdateBankAccountBody = Partial<CreateBankAccountBody>
