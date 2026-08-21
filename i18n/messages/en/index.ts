import { admin, app, blog, legal } from "./app";
import { auth, seo } from "./auth";
import { common, nav } from "./common";
import { cv, emails, errors } from "./errors";
import { marketing } from "./marketing";

export const en = {
  common,
  nav,
  auth,
  seo,
  marketing,
  errors,
  emails,
  cv,
  app,
  admin,
  legal,
  blog,
} as const;
