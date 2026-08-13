export interface PromoValidation {
  valid: boolean;
  discount: number;
  finalTotal: number;
  promoCode: string;
  type: string;
  value: number;
}
