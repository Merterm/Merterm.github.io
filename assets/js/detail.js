import { formatDate, getImgURL, renderNews, renderTravels, renderCourses } from './common.js';

document.addEventListener("DOMContentLoaded", async function () {
    // Your code here
    const params = getUrlParams();
    // console.log(params);

    document.querySelector(".title").innerHTML = capitalizeFirstLetter(
        params.page
    );

    if (params.page === "news") {
        const url =
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyIW6_Jj0sJaY2hsRlx90Fwu_LBos4BgFhaN8oQQGcb7hg-HY83i1amZlaOEUD_xHU9wCWEnJPCHjk/pub?gid=0&single=true&output=csv";
        const items = await loadCSV(url);
        renderNews(items, document.querySelector(".items"), Infinity);
    } else if (params.page === "travel") {
        const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyIW6_Jj0sJaY2hsRlx90Fwu_LBos4BgFhaN8oQQGcb7hg-HY83i1amZlaOEUD_xHU9wCWEnJPCHjk/pub?gid=444772691&single=true&output=csv";
        const items = await loadCSV(url);
        renderTravels(items, document.querySelector(".items"), Infinity);
    } else if (params.page === "teaching") {
        const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyIW6_Jj0sJaY2hsRlx90Fwu_LBos4BgFhaN8oQQGcb7hg-HY83i1amZlaOEUD_xHU9wCWEnJPCHjk/pub?gid=997579617&single=true&output=csv";
        const items = await loadCSV(url);
        renderCourses(items, document.querySelector(".items"), Infinity);
    } else if (params.page === "people") {
        const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRyIW6_Jj0sJaY2hsRlx90Fwu_LBos4BgFhaN8oQQGcb7hg-HY83i1amZlaOEUD_xHU9wCWEnJPCHjk/pub?gid=1048322423&single=true&output=csv";
        const items = await loadCSV(url);
        renderPeople(items, document.querySelector(".items"), Infinity);
    }
});
async function loadCSV(url) {
    return await fetch(url)
        .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
        .then((text) =>
            d3.csvParse(text, (d) => {
                const record = { ...d };
                console.log("Record", record);
                for (const prop in record) {
                    record[prop] =
                        record[prop] === "" || record[prop] === "na"
                            ? null
                            : record[prop];
                }
                return record;
            })
        );
}

document.querySelector(".back-button").addEventListener("click", function () {
    window.history.back();
});
function getUrlParams() {
    let params = new URLSearchParams(window.location.search);
    let obj = {};
    for (let param of params) {
        obj[param[0]] = param[1];
    }
    return obj;
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


export function renderPeople(people, container, maxPeople = 20) {
    people = people.filter((d) => d["Position"] !== "Principal Investigator");

    console.log('render people', people);

    const positions = [
        "Postdoctoral Fellow",
        "Research Associate",
        "Undergraduate Assistant",
    ];
    container.classList.add("people");
    container.innerHTML = "";
    people.sort((a, b) => {
        if (
            positions.indexOf(a["Position"]) > positions.indexOf(b["Position"])
        ) {
            return 1;
        }
        if (
            positions.indexOf(a["Position"]) < positions.indexOf(b["Position"])
        ) {
            return -1;
        }
        return 0;
    });

    // people
    //     .filter((d) => d["Status"] === "Present")
    //     .slice(0, maxPeople)
    //     .forEach((item, i) => {
    //         let elem = document.createElement("div");
    //         elem.setAttribute("role", "listitem");
    //         console.log("item", item);
    //         elem.innerHTML = `
    //         <a target="_blank"href="${item["Website"] ? item["Website"] : item["LinkedIn"]}">
    //             <img class="person-photo" src="${!item["Photo"]
    //                 ? "../assets/images/person.png"
    //                 : getURL(item["Photo"])
    //             }" alt="${item["Name"]}, ${item["Position"]}"/>
    //         </a>
    //         <div class="person-detail">${item["Name"]}<br>${item["Position"]}</div>
    //     `;
    //         setTimeout(function () {
    //             // do something after 1000 milliseconds
    //             container.appendChild(elem);
    //             elem.classList.add("item");
    //             console.log("delayed loading");

    //         }, 100 * i);

    //     });

    const alumni = document.createElement("section");
    alumni.innerHTML = `
        <h2>Alumni</h2>
        <div class="alumni" role="list"></div>
    `;
    container.parentNode.insertBefore(alumni, container.nextSibling);
    // container.parentNode.appendChild(alumni);
    container.classList.add("alumni");


    const alumniContainer = alumni.querySelector(".alumni");
    alumniContainer.innerHTML = "";
    people
        .sort((d) => d["Status"] === "Alumni" ? 1 : -1)
        .slice(0, maxPeople)
        .forEach((item, i) => {
            let elem = document.createElement("div");
            elem.setAttribute("role", "listitem");
            elem.innerHTML = `
            <a target="_blank"href="${item["Website"] ? item["Website"] : item["LinkedIn"]}">
                <img src="${!item["Photo"]
                    ? "../assets/images/person.png"
                    : getImgURL(item["Photo"])
                }" alt="${item["Name"]}, ${item["Position"]}"/>
            </a>

            <div class="person-detail">${item["Name"]}<br>${item["Position"]}</div>
        `;

            setTimeout(function () {
                console.log("delayed loading", i * 250);
                if (item["Status"] === "Present") {
                    container.appendChild(elem);
                } else if (item["Status"] === "Alumni") {
                    alumniContainer.appendChild(elem);
                }
                elem.classList.add("item");
                console.log("delayed loading");
            }, i*250);
        });
}
