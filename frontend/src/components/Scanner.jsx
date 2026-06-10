import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

const Scanner = ({ onScanSuccess }) => {
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    // Create the scanner instance
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, rememberLastUsedCamera: true },
      /* verbose= */ false
    );

    const handleScan = (decodedText, decodedResult) => {
      // Pause scanner to prevent multiple rapid scans
      html5QrcodeScanner.pause();
      
      onScanSuccessRef.current(decodedText, () => {
        // Callback to resume scanning if needed
        html5QrcodeScanner.resume();
      });
    };

    html5QrcodeScanner.render(handleScan, (error) => {
      // Ignore scan failures (happens constantly when no QR is in frame)
    });

    return () => {
      // Cleanup
      try {
        html5QrcodeScanner.clear();
      } catch (err) {
        console.error("Failed to clear html5QrcodeScanner. ", err);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
      <div id="qr-reader"></div>
      <style>{`
        #qr-reader {
          border: none !important;
        }
        #qr-reader button {
          background: #ff0844;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin: 10px;
          font-weight: bold;
        }
        #qr-reader select {
          padding: 8px;
          border-radius: 6px;
          margin: 10px;
          border: 1px solid #ccc;
        }
        #qr-reader__dashboard_section_csr span {
          color: #333;
        }
      `}</style>
    </div>
  );
};

export default Scanner;
