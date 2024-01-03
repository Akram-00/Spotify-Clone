function convertBytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

async function getSongs() {
  const songs = [];

  let musics = await fetch("http://127.0.0.1:5500/songs/");
  let response = await musics.text();
  let div = document.createElement("DIV");
  div.innerHTML = response;
  let a = div.querySelectorAll("li a ");
  a.forEach((e) => {
    if (e.href.endsWith(".mp3")) {
      const size = e.parentNode.querySelector(".size").textContent;
      const readableSize = convertBytesToMB(size);

      const songSrc = e.title.split(".")[0].split("-");

      const [songName, artistName] = songSrc;

      const song = {
        title: songName,
        artist: artistName,
        link: e.href,
        size: readableSize,
      };
      songs.push(song);
    }
  });
  return songs;
}

const song_0_link = `http://127.0.0.1:5500/songs/Abroad%20Again%20-%20Jeremy%20Blake.mp3`;
currentAudio = new Audio(song_0_link);
let isPlaying = false;
let statusImg = null;

const renderPlayPauseButton = (songLink) => {
  statusImg = isPlaying === true ? "pause-song.svg" : "play-song.svg";
  const playbarBtn = document.querySelector(".songbuttons .play-pause");

  const songElements = document.querySelectorAll(".songlist ol li");

  if (playbarBtn) {
    playbarBtn.src = statusImg;
  }

  songElements.forEach((songElement) => {
    const songElementLink = songElement.getAttribute("songLink");
    const playNowImg = songElement.querySelector(".playnow img");

    if (songElementLink === songLink) {
      playNowImg.src = statusImg;
    } else {
      // If it's not the current playing song, set it to the pause icon
      playNowImg.src = "play-song.svg";
    }
  });
};

const playCurrentMusic = (audio) => {
  if (currentAudio) {
    if (currentAudio.src === audio.src) {
      currentAudio.pause();
    } else {
      currentAudio.pause();
      currentAudio = audio;
      isPlaying = false;
    }
  }

  if (isPlaying) {
    isPlaying = false;
  } else {
    audio.play();
    currentAudio = audio;
    isPlaying = true;

    currentAudio.addEventListener("timeupdate", () => {
      if (currentAudio && currentAudio.currentTime && currentAudio.duration) {
        const duration = `${formatDuration(
          currentAudio.currentTime
        )} / ${formatDuration(currentAudio.duration)}`;
        document.querySelector(".playbar .song-time").innerHTML = duration;
        document.querySelector(".playbar .seekbar .circle").style.left = `${
          (currentAudio.currentTime / currentAudio.duration) * 100
        }%`;
        document.querySelector(".over-seekbar").style.width = `${
          (currentAudio.currentTime / currentAudio.duration) * 100
        }%`;
        document
          .querySelector(".playbar .seekbar")
          .addEventListener("click", (e) => {
            let percent =
              (e.offsetX / e.target.getBoundingClientRect().width) * 100;
            currentAudio.currentTime = (currentAudio.duration * percent) / 100;
            document.querySelector(".circle").style.left = `${percent}%`;
          });
      } else {
        document.querySelector("playbar .song-info").innerHTML = "";
        document.querySelector(".playbar .song-time").innerHTML = "0:00 / 0:00";
      }
    });
  }
  renderPlayPauseButton(currentAudio.src);
};

const main = async () => {
  let songs = await getSongs();

  const songOl = document.querySelector(".songlist ol");

  songs.forEach((song) => {
    const audio = new Audio(song.link);
    songOl.innerHTML += `
        <li songLink="${song.link}">
          <img class="invert" src="musical-note_461238.svg" alt="">
            <div class="info">
              <div class="song-name" song-name="${song.title}">${song.title}</div>
              <div class="song-artist" song-artist="${song.artist}">${song.artist}</div>
            </div>
            <div class="playnow">
              <span>play now</span>
              <img src="play-song.svg" class="invert" alt="playnow">
            </div>
        </li>
      `;
  });

  Array.from(document.querySelectorAll(".songlist ol li")).forEach((e) => {
    e.addEventListener("click", () => {
      const link = e.getAttribute("songLink");
      const audio = new Audio(link);
      playCurrentMusic(audio);
      renderPlayPauseButton(link);
    });
  });

  document.querySelector(".songbuttons").addEventListener("click", (event) => {
    const eventClass = event.target.classList;

    if (eventClass.contains("previous")) {
      const currentSong = songs.find((song) => song.link === currentAudio.src);
      const index = songs.indexOf(currentSong);
      const previousIndex = index === 0 ? songs.length - 1 : index - 1;
      const nextSong = new Audio(songs[previousIndex].link);
      playCurrentMusic(nextSong);
    } else if (eventClass.contains("play-pause")) {
      playCurrentMusic(currentAudio);
    } else if (eventClass.contains("next")) {
      const currentSong = songs.find((song) => song.link === currentAudio.src);
      const index = songs.indexOf(currentSong);
      const nextIndex = index < songs.length ? index + 1 : 0;
      const nextSong = new Audio(songs[nextIndex].link);
      playCurrentMusic(nextSong);
    }
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });
  document.querySelector(".close-menu").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
  });
};

main();
