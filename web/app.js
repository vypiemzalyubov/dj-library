let tracks = [];

let currentPage = 1;

const pageSize = 50;


const searchInput =
    document.getElementById("search");

const genreSelect =
    document.getElementById("genre");

const results =
    document.getElementById("results");

const counter =
    document.getElementById("counter");

const pagination =
    document.getElementById("pagination");

const paginationBottom =
    document.getElementById("pagination-bottom");



async function loadTracks() {

    const response =
        await fetch("../output/tracks.json");

    const data =
        await response.json();


    tracks =
        data.tracks.sort(
            (a, b) =>
                a.display_name.localeCompare(
                    b.display_name
                )
        );


    fillGenres();

    render();

}



function fillGenres() {

    const genres =
        new Set();


    tracks.forEach(track => {

        if (track.genres) {

            track.genres.forEach(
                genre => genres.add(genre)
            );

        }

    });


    [...genres]
        .sort()
        .forEach(genre => {

            const option =
                document.createElement("option");

            option.value = genre;

            option.textContent = genre;

            genreSelect.appendChild(option);

        });

}



function searchTracks() {

    const query =
        searchInput.value
            .toLowerCase()
            .split(" ")
            .filter(Boolean);


    const genre =
        genreSelect.value;


    return tracks.filter(track => {


        const textMatch =
            query.every(word =>
                track.search_text
                    .includes(word)
            );


        const genreMatch =
            !genre ||
            (
                track.genres &&
                track.genres.includes(genre)
            );


        return textMatch && genreMatch;


    });

}




function render() {


    const filtered =
        searchTracks();


    const totalPages =
        Math.ceil(
            filtered.length / pageSize
        );


    if (currentPage > totalPages) {

        currentPage = 1;

    }


    const start =
        (currentPage - 1) * pageSize;


    const items =
        filtered.slice(
            start,
            start + pageSize
        );


    counter.textContent =
        `Found: ${filtered.length} | Page ${currentPage}`;


    renderResults(items);

    renderPagination(totalPages);

}





function renderResults(items) {


    results.innerHTML = "";


    items.forEach(track => {


        const card =
            document.createElement("div");


        card.className = "track";


        const searchUrl =
            `https://www.google.com/search?q=${encodeURIComponent(
                track.filename.replace(".mp3", "")
            )}`;



        card.innerHTML = `


        <div class="title">


            <a
                href="${searchUrl}"
                target="_blank"
                class="online-search"
                title="Search online"
            >
                🌐
            </a>


            ${track.display_name}


        </div>



        <div class="info">


            <div>
                ⏱ ${formatDuration(track.duration)}
            </div>



            <div>
                🎚 ${track.bpm || ""}
                BPM • ${track.key || ""}
            </div>



            ${
                track.genres &&
                track.genres.length
                ?
                `
                <div>
                    🎛 ${track.genres.join(", ")}
                </div>
                `
                :
                ""
            }



            ${
                track.release_date
                ?
                `
                <div>
                    📅 ${track.release_date}
                </div>
                `
                :
                ""
            }


        </div>



        <details>


            <summary>
                Details
            </summary>



            <div class="details">


                <div class="path">
                    📂 ${track.path || ""}
                </div>


                <div class="filename">
                    📁 ${track.filename || ""}
                </div>


            </div>


        </details>


        `;



        results.appendChild(card);


    });


}





function renderPagination(totalPages) {


    pagination.innerHTML = "";

    paginationBottom.innerHTML = "";


    const pages =
        createPages(totalPages);



    [pagination, paginationBottom]
        .forEach(container => {


            pages.forEach(page => {


                const button =
                    document.createElement("button");


                button.textContent =
                    page;


                if (page === currentPage) {

                    button.classList.add(
                        "active"
                    );

                }


                button.onclick = () => {

                    currentPage = page;

                    render();

                };


                container.appendChild(button);


            });


        });


}




function createPages(totalPages) {


    if (totalPages <= 10) {

        return Array.from(
            {length: totalPages},
            (_, i) => i + 1
        );

    }


    return [

        1,
        2,
        3,
        "...",
        totalPages

    ];

}




function formatDuration(seconds) {


    if (!seconds) {

        return "";

    }


    const minutes =
        Math.floor(seconds / 60);


    const sec =
        seconds % 60;


    return `${minutes}:${String(sec).padStart(2,"0")}`;

}





searchInput.addEventListener(
    "input",
    () => {

        currentPage = 1;

        render();

    }
);



genreSelect.addEventListener(
    "change",
    () => {

        currentPage = 1;

        render();

    }
);



loadTracks();