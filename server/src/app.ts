import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import photoRoutes from "./modules/photos/photo.routes";
import photoByIdeaRoutes from "./modules/photos/photo.routes.byIdea";
import photoByUserRoutes from "./modules/photos/photo.routes.byUser";
import artByIdRoutes from "./modules/art/art.routes.byId";
import artByUserRoutes from "./modules/art/art.routes.byUser";
import artByArtRoutes from "./modules/art/art.routes.byArt";
import artByIdeaRoutes from "./modules/art/art.routes.byIdea";
import ideaRoutes from "./modules/ideas/idea.routes";
import userRoutes from "./modules/users/user.routes";
import blockRoutes from "./modules/users/block.routes";
import goalRoutes from "./modules/goals/goal.routes";
import feedRoutes from "./modules/feed/feed.routes";
import galleryRoutes from "./modules/gallery/gallery.routes";

export const app = express();

app.use(cors());
app.use(morgan("dev")); // logs every request to stdout — first place to look when debugging
// Ideas and goals take a JSON body — photos/art are multipart and
// parse their own body via multer, so this doesn't touch those routes.
app.use(express.json());

// Serves whatever LocalStorageAdapter wrote to disk, at the same /uploads/<key>
// URL that storage.save() returns. Swapping to S3 later means this line goes
// away and StoredFile.url points at the bucket instead — nothing else changes.
app.use("/uploads", express.static(path.resolve(env.storageDir)));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/photos", photoRoutes);
app.use("/art", artByIdRoutes);
app.use("/art/:artId/art", artByArtRoutes);
app.use("/users", userRoutes);
app.use("/users/:id/art", artByUserRoutes);
app.use("/users/:id/photos", photoByUserRoutes);
app.use("/ideas", ideaRoutes);
app.use("/ideas/:id/photos", photoByIdeaRoutes);
app.use("/ideas/:id/art", artByIdeaRoutes);
app.use("/blocks", blockRoutes);
app.use("/goals", goalRoutes);
app.use("/feed", feedRoutes);
app.use("/gallery-settings", galleryRoutes);

// Must be last: Express only routes here when a handler calls next(err),
// which asyncHandler() does automatically for everything above.
app.use(errorHandler);
