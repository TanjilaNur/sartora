export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFAQPayload {
  question: string;
  answer: string;
  category?: string;
  order?: number;
}

export interface UpdateFAQPayload extends Partial<CreateFAQPayload> {
  active?: boolean;
}
