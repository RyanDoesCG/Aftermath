const engineConsole = document.getElementById("console")
//engineConsole.innerHTML = "<div class=\"tabHeader\"><img src=\"images\\icons\\c.png\" alt=\"\"><h2>Console</h2></div>"
engineConsole.innerHTML = "<div class=\"tabHeader\"><h2>Console</h2></div>"

function format (number)
{
    return (number < 10) ? "0" + (number).toString() : (number).toString()
}

function log (string)
{
    const date = new Date()
    const timestamp = format(date.getHours()) + ":" + format(date.getMinutes()) + ":" + format(date.getSeconds())
    engineConsole.innerHTML += "<p>" + timestamp + " : " + string + "</p>"
    engineConsole.scrollTo(0, engineConsole.scrollHeight)

    console.log(string)
}

function clear ()
{
    engineConsole.innerHTML = "<div class=\"tabHeader\"><h2>Console</h2></div>"
}

window.onerror += function (msg, url, line, collumn, error) {
    const date = new Date()
    const timestamp = format(date.getHours()) + ":" + format(date.getMinutes()) + ":" + format(date.getSeconds())
    engineConsole.innerHTML += "<p style=\"color:#FF0000;\">" + timestamp + " : ERROR : " + msg + " " + url + " " + line + "</p>"
    engineConsole.innerHTML += "<p style=\"color:#FF0000;\">" + error.stack + "</p>"
    engineConsole.scrollTop = engineConsole.scrollHeight - engineConsole.clientHeight;
    console.log(msg + " " + url + " " + line)
    return false;
} 
