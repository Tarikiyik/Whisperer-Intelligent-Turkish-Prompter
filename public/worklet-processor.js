// public/worklet-processor.js

class PCMProcessor extends AudioWorkletProcessor {
  process (inputs) {
    const channelData = inputs[0][0];  // raw Float32 samples (mono)
    if (channelData) {
      const pcm = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        pcm[i] = Math.max(-32768, Math.min(32767, Math.round(channelData[i] * 32767)));
      }
      // transfer ArrayBuffer to main thread without copy
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true; 
  }
}

registerProcessor('pcm-processor', PCMProcessor);