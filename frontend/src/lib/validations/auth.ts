import { z } from 'zod';

// ============================================
// Validation message keys (for i18n)
// These can be used as translation keys
// ============================================

export const ValidationMessages = {
  // Email
  emailRequired: 'validationEmailRequired',
  emailInvalid: 'validationInvalidEmailFormat',
  // Password
  passwordRequired: 'validationPasswordRequired',
  passwordTooShort: 'validationPasswordTooShort',
  passwordsDoNotMatch: 'validationPasswordsDoNotMatch',
  passwordSameAsOld: 'validationPasswordSameAsOld',
  // Username
  usernameRequired: 'validationUsernameRequired',
  usernameTooShort: 'validationUsernameTooShort',
  usernameTooLong: 'validationUsernameTooLong',
  usernameInvalid: 'validationUsernameInvalid',
  // General
  fieldRequired: 'validationFieldRequired',
  termsRequired: 'validationTermsRequired',
} as const;

// ============================================
// Shared field schemas (reusable across forms)
// ============================================

export const emailSchema = z
  .string()
  .min(1, ValidationMessages.emailRequired)
  .email(ValidationMessages.emailInvalid);

export const passwordSchema = z
  .string()
  .min(1, ValidationMessages.passwordRequired)
  .min(8, ValidationMessages.passwordTooShort);

export const usernameSchema = z
  .string()
  .min(1, ValidationMessages.usernameRequired)
  .min(3, ValidationMessages.usernameTooShort)
  .max(50, ValidationMessages.usernameTooLong)
  .regex(/^[a-zA-Z0-9_]+$/, ValidationMessages.usernameInvalid);

// Username or email field (for sign-in)
export const usernameOrEmailSchema = z
  .string()
  .min(1, ValidationMessages.fieldRequired);

// ============================================
// Sign In Schema
// ============================================

export const signInSchema = z.object({
  usernameOrEmail: usernameOrEmailSchema,
  password: z.string().min(1, ValidationMessages.passwordRequired),
});

export type SignInFormData = z.infer<typeof signInSchema>;

// ============================================
// Sign Up Schema
// ============================================

export const signUpSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, ValidationMessages.fieldRequired),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: ValidationMessages.termsRequired,
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: ValidationMessages.passwordsDoNotMatch,
  path: ['confirmPassword'],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

// ============================================
// Forgot Password Schema
// ============================================

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ============================================
// Reset Password Schema
// ============================================

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, ValidationMessages.fieldRequired),
}).refine((data) => data.password === data.confirmPassword, {
  message: ValidationMessages.passwordsDoNotMatch,
  path: ['confirmPassword'],
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================
// Change Password Schema (for logged-in users)
// ============================================

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, ValidationMessages.passwordRequired),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().min(1, ValidationMessages.fieldRequired),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: ValidationMessages.passwordsDoNotMatch,
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: ValidationMessages.passwordSameAsOld,
  path: ['newPassword'],
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
