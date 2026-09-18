import { SetMetadata } from '@nestjs/common';

/**
 * Global auth primitive: marks a route as excluded from the global JWT guard.
 * Lives in /shared because every Bounded Context's presentation layer exposes
 * at least one public endpoint (e.g., Storage cover streaming for the
 * media viewers that cannot attach Authorization headers).
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
