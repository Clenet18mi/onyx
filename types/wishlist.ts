// ============================================
// ONYX - Wishlist / Liste d'envies
// ============================================

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priority: 1 | 2 | 3 | 4 | 5; // étoiles
  category?: string;
  url?: string;
  notes?: string;
  imageUri?: string;
  purchasedAt?: string; // si acheté -> crée transaction
  createdAt: string;
  updatedAt: string;
}
