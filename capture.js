export async function getWebcamStream() {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: true });
    } catch (e) {
      alert("Failed to access webcam: " + e.message);
      return null;
    }
  }
  
  export async function getScreenStream() {
    try {
      return await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor"
        },
        audio: false
      });
    } catch (e) {
      alert("Screen capture cancelled or blocked.");
      return null;
    }
  }
  
  