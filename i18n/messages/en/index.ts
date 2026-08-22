import { adminUi } from "./admin-ui";
import { api } from "./api";
import { admin, app, blog, legal } from "./app";
import { auth, seo } from "./auth";
import { common, nav } from "./common";
import { content } from "./content";
import { cv, emails, errors } from "./errors";
import { forms } from "./forms";
import { marketing } from "./marketing";
import { pages } from "./pages";

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
  pages,
  forms,
  adminUi,
  content,
  api,
} as const;
