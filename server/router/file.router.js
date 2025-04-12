import express from 'express';
import { upload } from '../utils/multer.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import Video from '../models/file.model.js';

export const fileRoute = express.Router();

cloudinary.config({
  cloud_name: 'dlx4nknv9',
  api_key: '163676898971472',
  api_secret: 'vuVC6TJF50rm8KyrInkGyrcOxaU',
});

// Upload video with required transcript text
fileRoute.post("/upload-video", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Video file is required' });
    }

    const { transcriptText } = req.body;
    
    if (!transcriptText || transcriptText.trim() === '') {
      return res.status(400).json({ message: 'Transcript text is required' });
    }

    // Upload video to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      public_id: req.file.filename,
      resource_type: "video",
    });

    const thumbnailUrl = uploadResult.secure_url.replace('.mp4', '-thumbnail.jpg');

    // Delete the local file after upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete local file:", err);
    });

    // Create and save new video with transcript text
    const newVideo = new Video({
      name: req.file.originalname,
      size: req.file.size,
      videoUrl: uploadResult.secure_url,
      thumbnailUrl: thumbnailUrl,
      transcriptText: transcriptText,
      fileType: req.file.mimetype,
    });

    await newVideo.save();

    res.json({
      message: 'Video with transcript uploaded successfully',
      video: newVideo,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: 'Error uploading video', error: e });
  }
});

fileRoute.get("/get-all-videos", async (req, res) => {
  try {
    const videos = await Video.find();
    res.json({ videos });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: 'Error fetching videos', error: e });
  }
});

// Add or update transcript for an existing video
fileRoute.post("/update-transcript/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const { transcriptText } = req.body;

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    if (!transcriptText || transcriptText.trim() === '') {
      return res.status(400).json({ message: 'Transcript text is required' });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Update the transcript text
    video.transcriptText = transcriptText;
    await video.save();

    res.json({
      message: 'Transcript updated successfully',
      video: video,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: 'Error updating transcript', error: e });
  }
});



// Get video URL and transcript by ID
fileRoute.get("/video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;

    if (!videoId) {
      return res.status(400).json({ message: 'Video ID is required' });
    }

    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json({
      videoUrl: video.videoUrl,
      transcriptText: video.transcriptText
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: 'Error fetching video details', error: e });
  }
});
