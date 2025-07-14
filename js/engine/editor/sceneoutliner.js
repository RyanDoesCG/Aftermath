class SceneOutliner
{
    constructor(engine)
    {
        this.engine = engine

        this.needsUpdate = false
        this.scrollTo = false
    }

    generateHTML()
    {
        var HTML = ""

        //HTML += "<div class=\"tabHeader\"><img width=30px height=30px src=\"images\\icons\\so.png\" alt=\"\"><h2>World Outliner</h2></div>"
        HTML += "<div class=\"tabHeader\"><h2>World Outliner</h2></div>"
        
        for (var i = 0; i < this.engine.scene.objects.length; ++i)
        {
            if (this.engine.scene.objects[i].editor)
            {
                continue
            }

            if (this.engine.scene.objects[i] == this.engine.editor.selected)
            {
                HTML += "<p id=\"" + this.engine.scene.objects[i].id + "\" class=\"sceneEntitySelected\">"
            }
            else
            {
                HTML += "<p id=\"" + this.engine.scene.objects[i].id + "\" class=\"sceneEntity\">"
            }

            HTML += this.engine.scene.objects[i].name
            HTML += "</p>"

            for (var j = 0; j < this.engine.scene.objects[i].components.length; ++j)
            {
                HTML += "<p class=\"sceneComponent\">"
                HTML += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
                HTML += this.engine.scene.objects[i].components[j].type
                HTML += "</p>"
            }
        }

        document.getElementById('outliner').innerHTML = HTML
    }

    attachHandlers()
    {   
        var entities = document.getElementsByClassName('sceneEntity')
        for (var i = 0; i < entities.length; ++i)
        {
            entities[i].addEventListener('click', (e) =>
            {
                this.engine.editor.selected = this.engine.scene.get(e.target.id)
                this.engine.editor.updateAllPanels = true
            })
        }

        var entities = document.getElementsByClassName('sceneEntitySelected')
        for (var i = 0; i < entities.length; ++i)
        {
            entities[i].addEventListener('click', (e) =>
            {
                this.engine.editor.selected = null
                this.engine.editor.updateAllPanels = true
            })
        }
    }

    scrollToSelected()
    {
        // scroll to selected object
        for (var i = 0; i < this.engine.scene.objects.length; ++i)
        {
            if (this.engine.scene.objects[i] == this.engine.editor.selected)
            {
                var element = document.getElementById(this.engine.scene.objects[i].id);
                if (element)
                {
                    var top = element.offsetTop;
                    document.getElementById('outliner').scrollTop = top - 50;
                }
            }
        }
    }

    update ()
    {
        if (this.needsUpdate)
        {
            this.generateHTML()
            this.attachHandlers()
            if (this.scrollTo)
            {
                this.scrollToSelected()
                this.scrollTo = false
            }

            this.needsUpdate = false
        }
    }
}