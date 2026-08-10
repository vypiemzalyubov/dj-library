from pathlib import Path
import json
import xml.etree.ElementTree as ET


COLLECTION = (
    Path.home()
    / "Documents"
    / "Native Instruments"
    / "Traktor 3.11.1"
    / "collection.nml"
)

OUTPUT = Path("output/tracks.json")


def fix_mojibake(text):
    if not text:
        return ""

    encodings = [
        ("latin1", "utf-8"),
        ("latin1", "cp1251"),
    ]

    for source, target in encodings:
        try:
            fixed = text.encode(source).decode(target)

            if any(
                "А" <= c <= "я"
                for c in fixed
            ):
                return fixed

        except UnicodeError:
            pass

    return text


def clean_text(text):
    if not text:
        return ""

    text = fix_mojibake(text)

    text = text.strip()

    text = " ".join(text.split())

    return text


def clean_genres(text):
    if not text:
        return []

    return [
        genre.strip()
        for genre in text.split(",")
        if genre.strip()
    ]


def get_child(element, name):
    return element.find(name)


def is_valid_track(entry):

    location = get_child(entry, "LOCATION")

    if location is None:
        return False

    directory = location.attrib.get("DIR", "")
    filename = location.attrib.get("FILE", "")

    if "Factory Sounds" in directory:
        return False

    if not filename:
        return False

    return True


def create_display_name(artist, title):

    if artist:
        return f"{artist} — {title}"

    return title


def create_folder_path(directory):

    parts = [
        part
        for part in directory.split("/:")
        if part
    ]

    # убираем полный путь пользователя
    if "Music" in parts:
        index = parts.index("Music")
        parts = parts[index + 1:]

    return " / ".join(parts)


def create_search_text(track):

    values = [
        track["artist"],
        track["title"],
        track["filename"],
        *track["genres"],
    ]

    return " ".join(
        value
        for value in values
        if value
    ).lower()


def export_tracks():

    tree = ET.parse(COLLECTION)
    root = tree.getroot()

    tracks = []

    skipped = 0


    for entry in root.findall(".//ENTRY"):

        if not is_valid_track(entry):
            skipped += 1
            continue


        location = get_child(entry, "LOCATION")
        info = get_child(entry, "INFO")
        tempo = get_child(entry, "TEMPO")


        artist = clean_text(
            entry.attrib.get("ARTIST", "")
        )

        title = clean_text(
            entry.attrib.get("TITLE", "")
        )


        track = {
            "artist": artist,
            "title": title,
            "filename": "",
            "directory": "",
            "folder": "",
            "path": "",
            "bpm": None,
            "key": "",
            "duration": None,
            "genres": [],
            "release_date": "",
            "display_name": "",
            "search_text": "",
        }


        if location is not None:

            track["filename"] = clean_text(
                location.attrib.get("FILE", "")
            )

            track["directory"] = location.attrib.get(
                "DIR",
                ""
            )


            parts = [
                part
                for part in track["directory"].split("/:")
                if part
            ]


            if parts:
                track["folder"] = parts[-1]


            track["path"] = create_folder_path(
                track["directory"]
            )


        if tempo is not None:

            bpm = tempo.attrib.get(
                "BPM",
                ""
            )

            if bpm:
                track["bpm"] = round(float(bpm))


        if info is not None:

            track["key"] = info.attrib.get(
                "KEY",
                ""
            )


            track["genres"] = clean_genres(
                info.attrib.get(
                    "GENRE",
                    ""
                )
            )


            track["release_date"] = info.attrib.get(
                "RELEASE_DATE",
                ""
            )


            playtime = info.attrib.get(
                "PLAYTIME",
                ""
            )

            if playtime:
                try:
                    track["duration"] = int(playtime)

                except ValueError:
                    pass


        track["display_name"] = create_display_name(
            track["artist"],
            track["title"],
        )


        track["search_text"] = create_search_text(
            track
        )


        tracks.append(track)


    OUTPUT.parent.mkdir(
        exist_ok=True
    )


    with OUTPUT.open(
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            {
                "count": len(tracks),
                "tracks": tracks,
            },
            file,
            ensure_ascii=False,
            indent=2,
        )


    print(
        f"Exported: {len(tracks)} tracks"
    )

    print(
        f"Skipped: {skipped}"
    )

    print(
        f"Saved: {OUTPUT}"
    )


if __name__ == "__main__":
    export_tracks()
