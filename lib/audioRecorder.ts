export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor() {}

  async startRecording(onRecordingComplete: (audioBlob: Blob) => void, chunkDuration: number = 5000) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
        this.chunks = [];
        onRecordingComplete(audioBlob);
      };

      this.mediaRecorder.start();
      console.log('Started recording');

      // Record in 30-second segments
      setInterval(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.mediaRecorder.stop();
          this.mediaRecorder.start();
        }
      }, 5000);

    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  stopRecording() {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
    this.mediaRecorder = null;
    this.chunks = [];
  }
} 