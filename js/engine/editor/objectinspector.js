class ObjectInspector
{
    constructor(engine)
    {
        this.engine = engine

        this.needsUpdate = false
    }

    generateHTML()
    {
        var HTML = ""

        //HTML += "<div class=\"tabHeader\"><img src=\"images\\icons\\oi.png\" alt=\"\"><h2>Object Inspector</h2></div>"
        HTML += "<div class=\"tabHeader\"><h2>Object Inspector</h2></div>"

        if (this.engine.editor.selected)
        {
            HTML += "<p>" + this.engine.editor.selected.name + " " + this.engine.editor.selected.id + "</p>"
            if (this.engine.editor.selected.transform)
            {
                HTML += "<p>" + this.engine.editor.selected.transform.toString() + "</p>"
            }
        }

        document.getElementById('inspector').innerHTML = HTML
    }

    attachHandlers()
    {

    }

    update ()
    {
        if (this.needsUpdate)
        {
            this.generateHTML()
            this.attachHandlers()

            this.needsUpdate = false
        }
    }
}