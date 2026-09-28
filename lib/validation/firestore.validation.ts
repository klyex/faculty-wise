import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import schema from '@/lib/schemas/firestore.schema.json';
import type { User, Schedule, Course, Room } from '@/lib/types/firestore.types';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Compile validators for each collection
const userValidator = ajv.compile(schema.definitions.user);
const scheduleValidator = ajv.compile(schema.definitions.schedule);
const courseValidator = ajv.compile(schema.definitions.course);
const roomValidator = ajv.compile(schema.definitions.room);

export function validateUser(data: unknown): { valid: boolean; errors: string[] } {
  const valid = userValidator(data);
  const errors = valid ? [] : (userValidator.errors?.map(err => `${err.instancePath} ${err.message}`) || []);
  return { valid, errors };
}

export function validateSchedule(data: unknown): { valid: boolean; errors: string[] } {
  const valid = scheduleValidator(data);
  const errors = valid ? [] : (scheduleValidator.errors?.map(err => `${err.instancePath} ${err.message}`) || []);
  return { valid, errors };
}

export function validateCourse(data: unknown): { valid: boolean; errors: string[] } {
  const valid = courseValidator(data);
  const errors = valid ? [] : (courseValidator.errors?.map(err => `${err.instancePath} ${err.message}`) || []);
  return { valid, errors };
}

export function validateRoom(data: unknown): { valid: boolean; errors: string[] } {
  const valid = roomValidator(data);
  const errors = valid ? [] : (roomValidator.errors?.map(err => `${err.instancePath} ${err.message}`) || []);
  return { valid, errors };
}
