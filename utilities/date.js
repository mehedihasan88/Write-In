const date = require("dateformat");

function getDate() {
    return date("dd mmmm yyyy");
}

function setCur() {
    const time = [];
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const thisMonth = Number(date("m"));
    const thisYear = Number(date("yyyy"));
    for (let i = thisMonth - 1; i >= 0; i--) {
        time.push(months[i] + " " + thisYear);
    }
    return time;
}

function setPast() {
    const time = [];
    const thisYear = Number(date("yyyy"));
    for (let i = thisYear - 1; i > 2016; i--) time.push(i);
    return time;
}


module.exports = {
    getDate,
    setCur,
    setPast
}
