For better dx use the extension es6-string-html
and comment /*html*/ infront of the string literals for the template 

Implementering

Søgeformular:

<div id="qpm_vapp" class="qpm_vapp">
    <main-wrapper 
        language="dk/en" 
        v-bind:hide-topics="['X00']"> 
    </main-wrapper>
</div>

<script>
var vueApp = new Vue({
    el: '#qpm_vapp'
    })
</script>


Specifikke artikler:

<div class="qpm_vapp" id="qpm_vappX">
    <specific-articles
        language="dk/en"
        ids="12345678,87654321"
        doi="DOI"
        :show-dimensions-badge="true/false"
        :show-altmetric-badge="true/false"
        :hide-buttons="true/false"
        query="PubMed-søgestreng"
        :query-results="xx"
        sort-method="date/relevance"
        :show-date="true/false"
        date="Dato"
        title="Titel"
        authors="Forfattere"
        :shown-six-authors="true/false"
        source="Kilde"
        abstract="Abstract"
        :sectioned-abstract="{
            'Overskrift 1': 'Tekst 1',
            'Overskrift 2': 'Tekst 2',
            'Overskrift N': 'Tekst N',
        }"
        hyper-link="URL"
        hyper-link-text="Link-tekst">
    </specific-articles>
</div>

<script>
var vueAppX = new Vue({
    el: '#qpm_vappX'
    })
var vueAppY = new Vue({
    el: '#qpm_vappY'
    })
</script>

