const GHOST_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
];

export const generateGhostAvatar = () => {
  const color = GHOST_COLORS[Math.floor(Math.random() * GHOST_COLORS.length)];
  return color; // For now, the avatar is just a color hex string
};
