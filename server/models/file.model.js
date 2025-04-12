import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: false,
  },
  transcriptText: {
    type: String,
    required: true, // Making transcript text required
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  fileType: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Video = mongoose.model('Video', videoSchema);

export default Video;