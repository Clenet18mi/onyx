// ============================================
// ONYX - Preset Animations (Reanimated)
// Entrées/sorties et micro-interactions
// ============================================

import {
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutUp,
  FadeInUp,
  FadeOutDown,
  SlideInLeft,
  SlideOutLeft,
  SlideInRight,
  SlideOutRight,
  ZoomIn,
  ZoomOut,
  BounceIn,
  BounceOut,
} from 'react-native-reanimated';

const duration = 300;
const springConfig = { damping: 15, stiffness: 150 };

/** Entrée / sortie fade */
export const FadeInAnimation = FadeIn.duration(duration);
export const FadeOutAnimation = FadeOut.duration(duration);

/** Slide depuis le bas (modals) */
export const SlideInUp = FadeInUp.duration(350).springify().damping(20);
export const SlideOutDown = FadeOutDown.duration(280);

/** Slide depuis les côtés */
export const SlideInFromLeft = SlideInLeft.duration(duration).springify();
export const SlideOutToLeft = SlideOutLeft.duration(duration);
export const SlideInFromRight = SlideInRight.duration(duration).springify();
export const SlideOutToRight = SlideOutRight.duration(duration);

/** Zoom */
export const ScaleIn = ZoomIn.duration(duration).springify();
export const ScaleOut = ZoomOut.duration(duration);

/** Bounce (succès, badges) */
export const BounceInAnimation = BounceIn.duration(400);
export const BounceOutAnimation = BounceOut.duration(300);

/** Fade depuis le haut (headers) */
export const FadeInDownAnimation = FadeInDown.duration(duration).springify();
export const FadeOutUpAnimation = FadeOutUp.duration(duration);
