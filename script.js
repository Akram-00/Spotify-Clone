// formatting the size
function convertBytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}
// formatting the duration
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

// getting the folder files
async function getFolder() {
  const folders = [];
  let folder = await fetch(`http://127.0.0.1:5500/songs/`);
  let responseText = await folder.text();
  let parser = new DOMParser();
  let response = parser.parseFromString(responseText, "text/html");
  response.querySelectorAll("ul li a").forEach(async (e) => {
    if (
      e.href.startsWith("http://127.0.0.1:5500/songs/") &&
      e.href.endsWith("_songs")
    ) {
      const folderObj = {
        link: e.href,
      };
      folders.push(folderObj);
      const infoJsonLink = await fetch(`${e.href}/info.json`);
      const response = await infoJsonLink.json();
      folderObj.infoJson = response;
    }
  });

  return folders;
}

// getting the music files inside a folder
async function getSongs(folder) {
  const songs = [];
  let musics = await fetch(folder);
  let response = await musics.text();
  let div = document.createElement("DIV");
  div.innerHTML = response;
  let a = div.querySelectorAll("li a");
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

// event listner for handling songButtons inside a playBar
async function handleSongButtons(event) {
  const eventClass = event.target.classList;
  const songs = await getSongs(currentFolderUrl);
  let currentSong, index;

  if (!currentAudio) {
    currentAudio = new Audio(songs[0].link);
  }

  if (currentAudio) {
    currentSong = songs.find((song) => song.link === currentAudio.src); // find the song object
    index = songs.indexOf(currentSong); // get the song Object index
    // previous song button
    if (eventClass.contains("previous")) {
      // if the index is 0 (first song) then go to songs.length - 1 ( last song)
      // if index is not 0 then set decreemet the index by 1 ( index - 1)
      const previousIndex = index === 0 ? songs.length - 1 : index - 1;
      // create new audio and pass it to the previousSong
      const previousSong = new Audio(songs[previousIndex].link);

      await playCurrentMusic(previousSong);
    }
    // play or pause button
    else if (eventClass.contains("play-pause")) {
      // play or pause the currentAudio
      await playCurrentMusic(currentAudio);
    }
    // next song button
    else if (eventClass.contains("next")) {
      // if index is last index then set the next index to be 0
      // if not increement the index by 1 ( index + 1)
      const nextIndex = index === songs.length - 1 ? 0 : index + 1;
      // create an new audio and pass the nextSong to the playCurrentMusic
      const nextSong = new Audio(songs[nextIndex].link);

      await playCurrentMusic(nextSong);
    }
  }
}

// dynamically displaying the songs play pause feature
function renderPlayPauseButton(songlink) {
  // if the isPlaying is true then pause Image or Play Image
  statusImg = !!isPlaying ? "assets/pause-song.svg" : "assets/play-song.svg";
  // selecting the currentSong playButton and playbar playbutton
  const playbarBtn = document.querySelector(".songbuttons .play-pause");
  const songElements = document.querySelectorAll(".songlist ol li");

  // if there is playbarBtn set the current status Image ( play / pause )
  if (playbarBtn) {
    playbarBtn.src = statusImg;
  }
  // Loop through the songElements
  songElements.forEach((songElement) => {
    // selecting the song element
    const songElementLink = songElement.getAttribute("songlink");
    const playNowImg = songElement.querySelector(".playnow img");
    // if the songelement matches set the status Image to ( play / pause )
    if (songElementLink === songlink) {
      playNowImg.src = statusImg;
    } else {
      // If it's not the current playing song, set it to the pause icon
      playNowImg.src = "assets/play-song.svg";
    }
  });
}

// Global variables
currentAudio = null;
let isPlaying = false;
let statusImg = null;
let currentFolderUrl = `http://127.0.0.1:5500/songs/tamil_songs`;
let currentVolume;
let muteStatus = false;

// currentmusic player
async function playCurrentMusic(audio) {
  // if the currentAudio is present ( not null )

  if (currentAudio) {
    // if the currentAudio and new Audio src is same
    if (currentAudio.src === audio.src) {
      // Pause the song
      currentAudio.pause();
      // if its not the same song
    } else {
      currentAudio.pause(); // pause the current audio playing ( previous song )
      currentAudio = audio; // set the new audio to current audio ( new song setting to current Audio )
      isPlaying = false; // set the isPlaying to false ( song is pasued for the song )
    }

    if (muteStatus === true) {
      currentAudio.volume = 0; // mute the audio
    } else if (muteStatus !== true) {
      currentAudio.volume = currentVolume ? currentVolume : 0.5; // unmute the audio 
    }
  }

  // if the song is not playing then the isPlaying is set to be false
  //  ( because we've clicked any of the play button )
  if (isPlaying) {
    isPlaying = false;
  } else {
    audio.play(); // play the given audio
    currentAudio = audio; // set the currentAudio to new Audio
    isPlaying = true; // set the isPlaying to be true

    const songList = await getSongs(currentFolderUrl); // getting the songs of the currentFolder

    const songObj = songList.find((song) => song.link === currentAudio.src); //getting the songObject ( clicked )

    // displaying the duration , song-info in the playbar
    document.querySelector(".playbar .song-info").innerHTML = !!songObj
      ? `${songObj.title} - ${songObj.artist}`
      : `Song Name - Aritist Name`;

    // adding a timeupdate Event to make the slibar more dynamic while playing the song
    currentAudio.addEventListener("timeupdate", () => {
      if (currentAudio && currentAudio.currentTime && currentAudio.duration) {
        const duration = `${formatDuration(
          currentAudio.currentTime
        )} / ${formatDuration(currentAudio.duration)}`;

        document.querySelector(
          ".playbar .song-time-volume .song-time"
        ).innerHTML = duration;

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
        document.querySelector(
          ".playbar .song-time-volume .song-time"
        ).innerHTML = "0:00 / 0:00";
      }
    });

    // setting mute and unmute button
    document.querySelector(".playbar").addEventListener("click", (e) => {
      const volumeButton = e.target.closest(".song-volume img");
      if (volumeButton) {
        muteStatus = !muteStatus;
        const volumeSlider = document.querySelector(
          ".song-volume .range input"
        );
        if (volumeButton.src.includes("assets/volume.svg")) {
          volumeButton.src = volumeButton.src.replace(
            "assets/volume.svg",
            "assets/mute.svg"
          );
          volumeSlider.value = 0;
        } else {
          volumeButton.src = volumeButton.src.replace(
            "assets/mute.svg",
            "assets/volume.svg"
          );
          volumeSlider.value = 50;
        }
        setTimeout(() => {
          console.log(currentAudio.src, muteStatus);
        }, 10);
        currentVolume = currentAudio.volume = muteStatus ? 0 : 0.5;
        e.stopImmediatePropagation();
      }
    });

    // setting the volume of the song while playing
    document.querySelector(".range input").addEventListener("change", (e) => {
      currentAudio.volume = parseInt(e.target.value) / 100;
      currentVolume = currentAudio.volume;
      if (currentAudio.volume === 0) {
        muteStatus = true;
        document.querySelector(".song-volume img").src = "assets/mute.svg";
      } else if (currentAudio !== 0) {
        muteStatus = false;
        document.querySelector(".song-volume img").src = "assets/volume.svg";
      }
    });
  }

  // rendering the play Pause button on each time playCurrentMusic is called ( either clicked play / pause )
  renderPlayPauseButton(currentAudio.src);
}

// displaying the current folderSongs
async function renderSongs() {
  const songListContainer = document.querySelector(".songlist ol");
  songListContainer.innerHTML = "";

  // getting the songList array of Objects from the currentFolder ( global variable )
  let songs = await getSongs(currentFolderUrl);

  // if there are songs in that folder
  if (songs) {
    songListContainer.innerHTML = "";
    // looping through each object and setting a songElement
    songs.forEach((song) => {
      songListContainer.innerHTML += `
        <li songlink="${song.link}">
          <img class="invert" src="assets/musical-note_461238.svg" alt="">
            <div class="info">
              <div class="song-name" song-name="${song.title}">${song.title}</div>
              <div class="song-artist" song-artist="${song.artist}">${song.artist}</div>
            </div>
            <div class="playnow">
              <span>play now</span>
              <img src="assets/play-song.svg" class="invert" alt="playnow">
            </div>
        </li>
      `;
    });

    // listen event from the songList under the library
    Array.from(document.querySelectorAll(".songlist ol li")).forEach((e) => {
      e.addEventListener("click", async () => {
        const link = e.getAttribute("songlink");
        const audio = new Audio(link);
        await playCurrentMusic(audio);
        renderPlayPauseButton(link);
      });
    });

    document
      .querySelector(".songbuttons")
      .addEventListener("click", handleSongButtons);
  }
}

// displaying available folders
async function renderFolders() {
  let folders = await getFolder();

  const folderGrid = document.querySelector("#spotifyPlaylist .card-container");

  await renderSongs();

  folders.forEach((folder) => {
    const folderTitle = folder.infoJson.title.split("_").join(" ");
    folderGrid.innerHTML += `
            <div class="card rounded js-playlist" folderLink = ${folder.link}>
              <img
                class="thumbnail rounded"
                src="${folder.infoJson.cover}"
                alt=""
              />
              <h3>${folderTitle}</h3>
              <img src="assets/green-play-btn.svg" alt="" class="green-play-btn js-playlist-play-btn" />
              <p>${folder.infoJson.description}</p>
            </div>      
    `;
  });

  Array.from(document.querySelectorAll(".card-container .js-playlist")).forEach(
    async (e) => {
      const link = e.getAttribute("folderLink");
      e.addEventListener("click", async () => {
        currentFolderUrl = link;
        await renderSongs();
      });
      e.querySelector(".js-playlist-play-btn").addEventListener(
        "click",
        async (e) => {
          currentFolderUrl = link;
          const songs = await getSongs(currentFolderUrl);
          const firstSong = new Audio(songs[0].link);
          playCurrentMusic(firstSong);
          await renderSongs();
          renderPlayPauseButton();
        }
      );
    }
  );
}


// main 
const main = async () => {
  await renderFolders();
};

main();

var leftPage = document.querySelector(".left");

document.querySelector(".hamburger").addEventListener("click", () => {
  leftPage.style.left = "0";
});

document.querySelector(".close-menu").addEventListener("click", () => {
  leftPage.style.left = "-100%";
});
