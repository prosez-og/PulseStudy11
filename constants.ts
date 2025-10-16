import type { Rank, PomodoroTheme } from './types';

export const ranks: Rank[] = [
  { name: 'CALIBRATING', min: 0, max: 499, badgeColors: ['#A9A9A9', '#808080'], icon: '—' },
  { name: 'IRON', min: 500, max: 999, badgeColors: ['#a19d94', '#706c64'], icon: 'I' },
  { name: 'BRONZE', min: 1000, max: 1499, badgeColors: ['#cd7f32', '#a06426'], icon: 'B', animationClass: 'shimmer' },
  { name: 'SILVER', min: 1500, max: 1999, badgeColors: ['#c0c0c0', '#a8a8a8'], icon: 'S', animationClass: 'shimmer' },
  { name: 'GOLD', min: 2000, max: 2499, badgeColors: ['#ffd700', '#d4af00'], icon: 'G', animationClass: 'shimmer' },
  { name: 'PLATINUM', min: 2500, max: 3499, badgeColors: ['#e5e4e2', '#b7b6b4'], icon: 'P', animationClass: 'glow-platinum' },
  { name: 'DIAMOND', min: 3500, max: 4499, badgeColors: ['#b9f2ff', '#7dd8f0'], icon: 'D', animationClass: 'glow-diamond' },
  { name: 'MASTER', min: 4500, max: 5999, badgeColors: ['#800080', '#c000c0'], icon: '★', animationClass: 'pulse-master' },
  { name: 'SPECIAL', min: 6000, max: 14999, badgeColors: ['#DA70D6', '#00FA9A', '#8A2BE2'], icon: '✨', animationClass: 'swirl-special' },
  { name: 'ELITE', min: 15000, max: 999999, badgeColors: ['#ff6ec4', '#7873f5', '#45d4ff'], icon: '👑', animationClass: 'swirl-elite', description: 'Awarded to the Top 250 players in the world.' }
];

export const AI_SYSTEM_INSTRUCTION = "You are an expert academic tutor named 'Pulse'. Your goal is to help students understand complex topics by providing clear, concise, and friendly explanations. Break down answers into simple steps. Avoid jargon where possible, or explain it if necessary. Keep responses helpful and encouraging. When a user asks you to create a task and does not provide a due date or a priority, you must ask for the missing information before calling the function. Do not assume defaults for priority or due date unless the user explicitly asks you to.";

export const AI_MODERATOR_SYSTEM_INSTRUCTION = "You are an AI moderator for a productivity app. Your role is to detect and prevent XP farming by analyzing user task completion patterns. You must be fair and assume good intent but also be strict about obvious abuse. A user should only get XP for a legitimate completion. Multiple completions in a very short period (e.g., seconds or minutes) are highly suspicious. A task being re-completed after a day or more could be legitimate (e.g., a daily recurring task). Based on the data provided, decide if the latest completion should be rewarded with XP.";

export const AI_SAMPLE_PROMPTS = [
  "Explain the concept of photosynthesis in simple terms.",
  "Help me brainstorm ideas for a history essay on the Roman Empire.",
  "Give me a 5-step guide to solving quadratic equations.",
  "Summarize the main themes in Shakespeare's 'Macbeth'.",
];

export const POMODORO_THEMES: PomodoroTheme[] = [
    { id: 'sunset', name: 'Sunset', background: 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab)', class: 'animated-gradient' },
    { id: 'ocean', name: 'Ocean', background: 'linear-gradient(to top, #00c6ff, #0072ff)', class: '' },
    { id: 'forest', name: 'Forest', background: 'linear-gradient(to top, #22c1c3, #fdbb2d)', class: '' },
    { id: 'night', name: 'Night Sky', background: 'linear-gradient(to bottom, #000428, #004e92)', class: '' },
];
