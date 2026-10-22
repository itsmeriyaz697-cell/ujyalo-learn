import type { Course, Resource, SiteSettings } from './types';
import data from '../../../shared/content-seed.json';

/**
 * Starter library.
 *
 * The content itself lives in `shared/content-seed.json` so the app and the
 * build-time sitemap generator read exactly the same records. These are
 * deliberately *learning paths*, not textbook chapters: each lesson hands the
 * student to a tool (tutor, quiz, flashcards) with a concrete task. Nothing
 * here claims to be official curriculum.
 *
 * The study-skills resources are original Ujyalo Learn writing. They contain
 * advice about how to study, not exam predictions.
 */

export const SEED_COURSES = data.courses as Course[];
export const SEED_RESOURCES = data.resources as Resource[];
export const DEFAULT_SETTINGS = data.settings as SiteSettings;
