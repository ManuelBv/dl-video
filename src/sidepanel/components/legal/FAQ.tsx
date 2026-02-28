export function FAQ() {
  return (
    <div className="space-y-2">
      <div>
        <p className="font-semibold">Is it legal to download videos?</p>
        <p>It depends on the content and your jurisdiction. Downloading content you own, have purchased, or that is explicitly licensed for offline use is generally permitted. Downloading copyrighted content without authorisation is not.</p>
      </div>
      <div>
        <p className="font-semibold">Why can&apos;t I download DRM-protected videos?</p>
        <p>DRM (Digital Rights Management) content is encrypted and legally protected. Circumventing DRM is prohibited under laws such as the DMCA (US) and the EU Copyright Directive. dl-video intentionally does not bypass DRM.</p>
      </div>
      <div>
        <p className="font-semibold">What if a video isn&apos;t detected?</p>
        <p>Some videos are loaded dynamically or require authentication. Try navigating to the page and starting playback before scanning. Videos served via DRM or encrypted streams cannot be downloaded.</p>
      </div>
    </div>
  );
}
