/* eslint-disable */
import { makeVideo } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const videos = block.querySelectorAll('div a');

  videos.forEach((video) => {
    video.href = video.href;
    makeVideo(video.parentElement.parentElement, video.href);
    video.remove();
  });

  block.querySelector(':scope > div:nth-of-type(1)').classList.add('desktop-video-container');
}
