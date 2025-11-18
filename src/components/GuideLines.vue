<template>
  <div class="guide-lines">
    <router-link to="/">Back to annotation form</router-link>
      <v-row>
        <v-col cols="12">
          <h1>Skin Annotation Guidelines</h1>
          <p>
            This guide will help you annotate skin images accurately. You do not need to be a dermatologist. Use visual cues, common sense, and examples provided below.
          </p>
        </v-col>
      </v-row>

    <v-row>
      <v-col cols="12">
        <h2>Patient Metadata</h2>
        <v-table class="guide-table" density="compact">
          <thead>
          <tr>
            <th>Age Category</th>
            <th>Range</th>
          </tr>
          </thead>
          <tbody>
          <tr><td>Infant</td><td>0-1</td></tr>
          <tr><td>Toddler</td><td>1-3</td></tr>
          <tr><td>Child</td><td>4-12</td></tr>
          <tr><td>Teen</td><td>13-17</td></tr>
          <tr><td>Young Adult</td><td>18-25</td></tr>
          <tr><td>Adult</td><td>26-39</td></tr>
          <tr><td>Middle-aged Adult</td><td>40-59</td></tr>
          <tr><td>Older Adult</td><td>60-74</td></tr>
          <tr><td>Senior</td><td>75+</td></tr>
          <tr><td>Unknown</td><td>-</td></tr>
          </tbody>
        </v-table>
        <ul>
          <li>
            <strong>Gender:</strong> Male / Female / Other / Unknown — choose what appears most likely.
          </li>
          <li>
            <strong>Ethnicity:</strong> Choose from the provided options what appears most likely.
          </li>
        </ul>
      </v-col>
    </v-row>

      <v-row>
        <v-col cols="12">
          <h2>Skin Types</h2>
          <p>
            Look at the skin’s texture and shine to determine primary and secondary skin type:
          </p>
          <a href="https://serenity.ae/skin-types-and-facials/"><strong>Useful link to recognise different type of skin</strong></a>
          <img src="/436130120_1595891087918904_468245995092563215_n.jpg" alt="Exemple" class="example-image">
          <v-table class="guide-table" density="compact">
            <thead>
            <tr>
              <th>Skin Type</th>
              <th>Description</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>Normal</td>
              <td>Even texture, not oily or dry.</td>
            </tr>
            <tr>
              <td>Dry</td>
              <td>Flaky, rough, dull.</td>
            </tr>
            <tr>
              <td>Oily</td>
              <td>Shiny, larger pores, prone to blemishes.</td>
            </tr>
            <tr>
              <td>Combination</td>
              <td>T-zone oily, cheeks normal/dry.</td>
            </tr>
            <tr>
              <td>Sensitive</td>
              <td>Red, inflamed, or reactive easily.</td>
            </tr>
            <tr>
              <td>Unknown</td>
              <td>Not clear.</td>
            </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>

    <v-row>
      <v-col cols="12">
        <h2>Acne & Lesions</h2>
        <p>Check if acne is present and identify types:</p>
        <img src="https://www.bionova.co.in/Articles/wp-content/uploads/2024/01/Types-of-Acne-scaled.jpg" alt="Exemple" class="example-image">
        <img src="https://skinive.com/wp-content/uploads/2018/12/what-does-acne-look-like-1.png" alt="Exemple" class="example-image">
        <v-table class="guide-table" density="compact">
          <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Blackheads</td>
            <td>Small dark spots, non-inflamed.</td>
            <td><a href="https://commons.wikimedia.org/wiki/File:Blackhead.png" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Whiteheads</td>
            <td>Small white bumps, non-inflamed.</td>
            <td><a href="https://commons.wikimedia.org/wiki/File:Whitehead.png" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Papules</td>
            <td>Small red bumps, inflamed.</td>
            <td><a href="https://commons.wikimedia.org/wiki/File:Acne_papule.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Pustules</td>
            <td>Red bumps with pus.</td>
            <td><a href="https://commons.wikimedia.org/wiki/File:Pustule.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Nodules</td>
            <td>Large, deep, painful bumps.</td>
            <td><a href="https://commons.wikimedia.org/wiki/File:Acne_nodule.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Acne Severity</td>
            <td colspan="2">none / mild / moderate / severe</td>
          </tr>
          <tr>
            <td>Acne Scarring</td>
            <td colspan="2">Small indentations or pigmentation left after acne.</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h2>Pigmentation</h2>
        <img src="https://dlmaesthetics.com/wp-content/uploads/2023/09/types-of-pigmentation.jpg" alt="Example" class="example-image">
        <v-table class="guide-table" density="compact">
          <thead>
          <tr>
            <th>Type</th>
            <th>Description</th>
            <th>Example</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Hyperpigmentation</td>
            <td>Dark spots (sun, post-acne, etc.).</td>
            <td><a href="https://img.lb.wbmdstatic.com/vim/live/webmd/consumer_assets/site_images/article_thumbnails/BigBead/hyperpigmentation-hypopigmentation-and-your-skin-bigbead/1800x1200-hyperpigmentation-hypopigmentation-and-your-skin-bigbead.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Hypopigmentation</td>
            <td>Areas lighter than surrounding skin.</td>
            <td><a href="https://img.lb.wbmdstatic.com/vim/live/webmd/consumer_assets/site_images/article_thumbnails/BigBead/hyperpigmentation-hypopigmentation-and-your-skin-bigbead/1800x1200-hyperpigmentation-hypopigmentation-and-your-skin-bigbead.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Melasma</td>
            <td>Brown patches, often on cheeks or forehead.</td>
            <td><a href="https://cyspera.com/wp-content/uploads/melasma-486x573.jpeg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Freckles</td>
            <td>Small brown spots (ephelides).</td>
            <td><a href="https://www.thepinkfoundry.com/cdn/shop/articles/Freckles_on_Face__Causes_Treatment_and_Prevention.webp?v=1745472706&width=2048" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Sunspots</td>
            <td>Brown spots from sun exposure (solar lentigines).</td>
            <td><a href="./491452961_17903460810115919_3211806260977904056_n.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>PIH</td>
            <td>Post-inflammatory hyperpigmentation (after injury or inflammation).</td>
            <td><a href="./491452961_17903460810115919_3211806260977904056_n.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>PIE</td>
            <td>Post-inflammatory erythema (red marks after inflammation).</td>
            <td><a href="./491452961_17903460810115919_3211806260977904056_n.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Vitiligo</td>
            <td>Loss of pigmentation, well-defined white patches.</td>
            <td><a href="https://images.squarespace-cdn.com/content/v1/672055690172ec58a24d8eeb/1730230706609-6L3W1B9FB5I8HQMPVICP/058b7-a5e9641ec070062280c5d9b429532cdf.jpg" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Nevus</td>
            <td>Birthmark or congenital pigmented spot.</td>
            <td><a href="https://i0.wp.com/images-prod.healthline.com/hlcmsresource/images/galleries/nevus/Congenital_nevus-1296x728-slide1.jpg?w=1155" target="_blank">example</a></td>
          </tr>
          <tr>
            <td>Other</td>
            <td colspan="2">Other pigmentation type not listed.</td>
          </tr>
          <tr>
            <td>Unknown</td>
            <td colspan="2">If uncertain.</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h2>Skin Quality</h2>
        <p>Use scales 0–10 (0 = none, 10 = extreme):</p>
        <img src="https://www.researchgate.net/publication/51519496/figure/fig1/AS:294411918430235@1447204679493/Photographic-examples-of-the-three-skin-ageing-scores-wrinkle-vascularity-and.png" alt="Example" class="example-image">
        <v-table class="guide-table" density="compact">
          <thead>
          <tr>
            <th>Aspect</th>
            <th>Description</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Redness</td>
            <td>Visible redness / irritation.</td>
          </tr>
          <tr>
            <td>Pores</td>
            <td>Size / visibility of pores.</td>
          </tr>
          <tr>
            <td>Texture</td>
            <td>Smooth vs rough, bumps.</td>
          </tr>
          <tr>
            <td>Shine</td>
            <td>Oiliness / glossy appearance.</td>
          </tr>
          <tr>
            <td>Dehydration Signs</td>
            <td>Flakiness, dullness.</td>
          </tr>
          <tr>
            <td>Wrinkles</td>
            <td>Count / visibility; select regions if possible.</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h2>Skin Region & Context</h2>
        <v-table class="guide-table" density="compact">
          <thead>
          <tr>
            <th>Field</th>
            <th>Description</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Region</td>
            <td>Select the region (face, forehead, cheeks, chin, neck, etc.)</td>
          </tr>
          <tr>
            <td>Has Makeup?</td>
            <td>Yes/No — avoid guessing, only if clearly visible</td>
          </tr>
          <tr>
            <td>Notes</td>
            <td>Optional free text for special observations</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h2>Annotation Confidence</h2>
        <v-table class="guide-table" density="compact">
          <thead>
          <tr>
            <th>Field</th>
            <th>Description</th>
          </tr>
          </thead>
          <tbody>
          <tr>
            <td>Confidence</td>
            <td>Rate how confident you are in your annotations (0 = unsure, 10 = completely confident). If unsure about most fields, mark low confidence.</td>
          </tr>
          </tbody>
        </v-table>
      </v-col>
    </v-row>

      <v-row>
        <v-col cols="12">
          <p>
            ⚠️ Always prioritize visual cues over assumptions. If an image is unclear, mark “Unknown” or skip. Use the provided reference links to guide your choices.
          </p>
        </v-col>
      </v-row>
    <router-link to="/">Back to annotation form</router-link>
  </div>
</template>

<script setup>
// No script needed for static guidelines
</script>

<style scoped>
.guide-lines {
  width: 100%;
  margin: 0;
  padding: 2rem;
  background: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
h1 {
  margin-bottom: 1rem;
}
ul {
  margin-bottom: 1.5rem;
}
h1 { font-size: 2em; margin-bottom: 1rem; }
h2 { font-size: 1.5em; margin-top: 2rem; }
ul { margin-left: 1rem; }
a { color: #1e88e5; text-decoration: underline; }

ul, li {
  padding-left: 0;
  margin-left: 0;
  text-decoration: none;
  list-style-type: none!important;
}

.guide-lines {
  width: 100%;
  margin: 0;
  padding: 2.5rem 3rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(30,136,229,0.08);
  font-family: 'Segoe UI', Arial, sans-serif;
  color: #222;
}

.example-image {
  margin: 1rem 0;
  text-align: center;
  max-width: 1000px;
  color: #555;
}

h1, h2 {
  color: #1976d2;
  font-weight: 600;
}

ul > li {
  margin-bottom: 1rem;
  padding-left: 1.2rem;
  position: relative;
}

ul > li::before {
  position: absolute;
  left: 0;
  color: #1976d2;
  font-weight: bold;
}

a {
  color: #1976d2;
  text-decoration: underline;
  transition: color 0.2s;
}
a:hover {
  color: #0d47a1;
}
</style>

