import { Review, IReview } from './review.model';
import { Product } from '../products/product.model';
import { Order } from '../orders/order.model';
import { awardPoints } from '../points/points.service';

function notFound(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 404;
  throw err;
}

function badRequest(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 400;
  throw err;
}

function forbidden(msg: string): never {
  const err = new Error(msg);
  (err as any).status = 403;
  throw err;
}

async function syncProductRating(productId: string): Promise<void> {
  const result = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg = result[0]?.avg ?? 0;
  const count = result[0]?.count ?? 0;
  await Product.findByIdAndUpdate(productId, { averageRating: Math.round(avg * 10) / 10, reviewCount: count });
}

async function hasVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
  const order = await Order.findOne({
    user: userId,
    'items.product': productId,
    status: { $in: ['processing', 'shipped', 'delivered'] },
  });
  return !!order;
}

export async function createReview(
  userId: string,
  productId: string,
  rating: number,
  text: string
): Promise<IReview> {
  if (!rating || rating < 1 || rating > 5) badRequest('rating must be between 1 and 5');

  const product = await Product.findById(productId);
  if (!product) notFound('Product not found');

  const existing = await Review.findOne({ user: userId, product: productId });
  if (existing) {
    const err = new Error('You have already reviewed this product');
    (err as any).status = 409;
    throw err;
  }

  const verified = await hasVerifiedPurchase(userId, productId);
  let review: IReview;
  try {
    review = await Review.create({ user: userId, product: productId, rating, text: text ?? '', verified });
  } catch (err: any) {
    // Backstopped by the unique (user, product) index — the check above
    // can't close a race between two concurrent submissions (e.g. a
    // double-click on "Submit").
    if (err.code === 11000) {
      const dup = new Error('You have already reviewed this product');
      (dup as any).status = 409;
      throw dup;
    }
    throw err;
  }
  await syncProductRating(productId);
  awardPoints(userId, 'review', (review._id as any).toString()).catch((err) =>
    console.error(`[points] Failed to award review points for review ${review._id}:`, err)
  );
  return review;
}

export async function getProductReviews(
  productId: string,
  page = 1,
  limit = 20
): Promise<{ reviews: IReview[]; total: number; page: number; pages: number; averageRating: number }> {
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  const ratingResult = await Review.aggregate([
    { $match: { product: new (require('mongoose').Types.ObjectId)(productId) } },
    { $group: { _id: null, avg: { $avg: '$rating' } } },
  ]);
  const averageRating = ratingResult[0]?.avg ? Math.round(ratingResult[0].avg * 10) / 10 : 0;

  return { reviews: reviews as unknown as IReview[], total, page, pages: Math.ceil(total / limit), averageRating };
}

export async function getUserReviews(userId: string): Promise<IReview[]> {
  return Review.find({ user: userId })
    .populate('product', 'name images')
    .sort({ createdAt: -1 })
    .lean() as unknown as Promise<IReview[]>;
}

export async function updateReview(
  reviewId: string,
  userId: string,
  rating?: number,
  text?: string
): Promise<IReview> {
  const review = await Review.findById(reviewId);
  if (!review) notFound('Review not found');
  if (review.user.toString() !== userId) forbidden('You can only edit your own reviews');
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) badRequest('rating must be between 1 and 5');
    review.rating = rating;
  }
  if (text !== undefined) review.text = text;
  await review.save();
  await syncProductRating(review.product.toString());
  return review;
}

export async function deleteReview(reviewId: string, userId: string, userRole: string): Promise<void> {
  const review = await Review.findById(reviewId);
  if (!review) notFound('Review not found');
  if (userRole !== 'admin' && review.user.toString() !== userId) {
    forbidden('You can only delete your own reviews');
  }
  const productId = review.product.toString();
  await review.deleteOne();
  await syncProductRating(productId);
}

export async function reportReview(reviewId: string, userId: string): Promise<IReview> {
  const review = await Review.findById(reviewId);
  if (!review) notFound('Review not found');
  if (review.user.toString() === userId) badRequest('You cannot report your own review');
  review.reported = true;
  await review.save();
  return review;
}

export async function getReportedReviews(): Promise<IReview[]> {
  return Review.find({ reported: true })
    .populate('user', 'name email')
    .populate('product', 'name')
    .sort({ createdAt: -1 })
    .lean() as unknown as Promise<IReview[]>;
}
