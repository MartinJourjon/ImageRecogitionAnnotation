<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps({
  record: { type: Object, required: true },
  tableName: { type: String, required: true }
})
const emit = defineEmits(['saved'])

const ageCategories = [
  'infant (0-1)',
  'toddler (1-3)',
  'child (4-12)',
  'teen (13-17)',
  'young adult (18-25)',
  'adult (26-39)',
  'middle-aged adult (40-59)',
  'older adult (60-74)',
  'senior (75+)',
  'unknown'
]
const ethnicityItems = [
  'White',
  'Black/African',
  'East Asian',
  'South Asian',
  'Southeast Asian',
  'Middle Eastern/North African (MENA)',
  'Hispanic/Latino',
  'Indigenous/Native',
  'Pacific Islander',
  'Mixed',
  'Other',
  'Unknown'
]

const scaleItems = [
  { title: '0 - Not visible at all', value: 0 },
  { title: '1 - Very very low', value: 1 },
  { title: '2 - Very low', value: 2 },
  { title: '3 - Low', value: 3 },
  { title: '4 - Rather low', value: 4 },
  { title: '5 - Medium', value: 5 },
  { title: '6 - Rather high', value: 6 },
  { title: '7 - High', value: 7 },
  { title: '8 - Very high', value: 8 },
  { title: '9 - Very very high', value: 9 },
  { title: '10 - Extreme / Very visible', value: 10 }
]

const fieldGroups = [
  {
    title: 'Patient metadata',
    fields: [
      // Removed: age numeric; replaced by age_category select
      { key: 'age_category', label: 'Age category', type: 'select', items: ageCategories },
      { key: 'gender', label: 'Gender', type: 'select', items: ['male','female','other','unknown'] },
      { key: 'ethnicity', label: 'Ethnicity', type: 'select', items: ethnicityItems }
    ]
  },
  {
    title: 'Skin types',
    fields: [
      { key: 'skin_type_primary', label: 'Primary skin type', type: 'select', items: ['normal','dry','oily','combination','sensitive','unknown'] },
      { key: 'skin_type_secondary', label: 'Secondary skin type', type: 'select', items: ['normal','dry','oily','combination','sensitive','none','unknown'] }
    ]
  },
  {
    title: 'Acne',
    fields: [
      { key: 'acne_present', label: 'Acne present', type: 'boolean' },
      { key: 'acne_severity', label: 'Acne severity', type: 'select', items: ['none','mild','moderate','severe'] },
      // Lesions are booleans per schema
      { key: 'blackheads', label: 'Blackheads', type: 'boolean' },
      { key: 'whiteheads', label: 'Whiteheads', type: 'boolean' },
      { key: 'papules', label: 'Papules', type: 'boolean' },
      { key: 'pustules', label: 'Pustules', type: 'boolean' },
      { key: 'nodules', label: 'Nodules', type: 'boolean' },
      // Text field in schema; provide simple free-text or categorical later
      { key: 'scarring_acne', label: 'Acne scarring', type: 'text' }
    ]
  },
  {
    title: 'Pigmentation',
    fields: [
      { key: 'pigmentation_present', label: 'Pigmentation present', type: 'boolean' },
      { key: 'pigmentation_type', label: 'Pigmentation type', type: 'select', items: [
        'hyperpigmentation','hypopigmentation','melasma','freckles','sunspots','PIH','PIE','vitiligo','nevus','other','unknown'
      ] }
    ]
  },
  {
    title: 'Skin quality',
    fields: [
      { key: 'redness_level', label: 'Redness (0–10)', type: 'scale', items: scaleItems },
      { key: 'pores', label: 'Pores (0–10)', type: 'scale', items: scaleItems },
      { key: 'texture', label: 'Texture (0–10)', type: 'scale', items: scaleItems },
      { key: 'shine', label: 'Shine (0–10)', type: 'scale', items: scaleItems },
      { key: 'dehydration_signs', label: 'Dehydration signs', type: 'boolean' },
      { key: 'wrinkle_score', label: 'Wrinkles (0–10)', type: 'scale', items: scaleItems },
      { key: 'region_wrinkles', label: 'Wrinkle areas', type: 'select', items: [
        'forehead', 'crow’s feet', 'under eyes', 'nasolabial folds', 'marionette lines', 'glabella', 'neck', 'other', 'none'
      ] }
    ]
  },
  {
    title: 'Skin region',
    fields: [
      { key: 'skin_region', label: 'Skin region', type: 'select', items: [
        'face','forehead','left_cheek','right_cheek','nose','chin','jawline','neck','scalp','ears','shoulders','back','chest','abdomen','arms','hands','legs','feet','other'
      ] }
    ]
  },
  {
    title: 'Image context',
    fields: [
      { key: 'has_makeup', label: 'Has makeup', type: 'boolean' },
      // Removed: crop_type
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    title: 'Annotation',
    fields: [
      { key: 'annotator_id', label: 'Annotateur ID', type: 'text' },
      { key: 'annotation_confidence', label: 'Confiance (0–10)', type: 'scale', items: scaleItems }
    ]
  }
]

const form = ref({})

watch(() => props.record, (r) => {
  if (!r) return
  const init = {}
  fieldGroups.forEach(g => g.fields.forEach(f => {
    const v = r[f.key]
    if (v !== undefined && v !== null) {
      init[f.key] = v
    } else {
      init[f.key] = f.type === 'boolean' ? false : (f.type === 'scale' ? 0 : (f.type === 'number' ? 0 : ''))
    }
  }))
  // Defaults and legacy mapping
  if (!init.skin_region) init.skin_region = 'face'
  if (!init.age_category) {
    const a = Number(r.age)
    init.age_category = Number.isFinite(a)
      ? (a <= 1 ? 'infant (0-1)'
        : a <= 3 ? 'toddler (1-3)'
        : a <= 12 ? 'child (4-12)'
        : a <= 17 ? 'teen (13-17)'
        : a <= 25 ? 'young adult (18-25)'
        : a <= 39 ? 'adult (26-39)'
        : a <= 59 ? 'middle-aged adult (40-59)'
        : a <= 74 ? 'older adult (60-74)'
        : 'senior (75+)')
      : 'unknown'
  }
  form.value = init
}, { immediate: true })

const saving = ref(false)
const deleting = ref(false)
const errorMsg = ref('')

async function save() {
  if (!props.record) return
  saving.value = true
  errorMsg.value = ''
  // Cast types per schema (numbers -> Number, booleans remain booleans)
  const payload = { ...form.value }
  fieldGroups.forEach(g => g.fields.forEach(f => {
    if (f.type === 'number' || f.type === 'scale') {
      const n = Number(payload[f.key])
      payload[f.key] = Number.isFinite(n) ? n : 0
    } else if (f.type === 'boolean') {
      // Ensure explicit boolean (checkbox v-model already does this)
      payload[f.key] = payload[f.key] === true
    }
  }))
  payload.annotation_timestamp = new Date().toISOString()
  payload.status = 'done'
  const { error } = await supabase.from(props.tableName).update(payload).eq('img_id', props.record.img_id)
  saving.value = false
  if (error) {
    errorMsg.value = error.message
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    emit('saved')
  }
}

async function deleteAsNotHuman() {
  if (!props.record) return
  deleting.value = true
  errorMsg.value = ''
  const { error } = await supabase
    .from(props.tableName)
    .delete()
    .eq('img_id', props.record.img_id)
  deleting.value = false
  if (error) {
    errorMsg.value = error.message
  } else {
    emit('saved')
  }
}

async function skip() {
  if (!props.record) return
  errorMsg.value = ''
  try {
    // When skipping, mark as 'skipped' but only if still in_progress (atomic)
    const payload = { status: 'skipped', annotation_timestamp: new Date().toISOString() }
    const { data, error } = await supabase
      .from(props.tableName)
      .update(payload)
      .eq('img_id', props.record.img_id)
      .eq('status', 'in_progress')
      .select('img_id')
    if (error) {
      errorMsg.value = error.message
      return
    }
    if (!data || data.length === 0) {
      // Someone else changed status; try a fallback: just emit saved so UI moves on
      emit('saved')
      return
    }
  } catch (e) {
    errorMsg.value = String(e)
    return
  }
  emit('saved')
}

const ready = computed(() => !!props.record)
</script>

<template>
  <v-form v-if="ready" @submit.prevent="save">
    <v-row class="mb-4" align="center" justify="space-between">
      <v-col cols="12" md="6">
        <v-btn :href="record.image_link || record.img_path" target="_blank" variant="text" prepend-icon="mdi-open-in-new">
          Open full image
        </v-btn>
      </v-col>
      <v-col cols="12" md="6" class="text-md-right">
        <v-btn color="info" variant="text" to="/guidelines" tag="router-link" prepend-icon="mdi-help-circle-outline">
          View guidelines
        </v-btn>
        <v-btn color="error" variant="text" @click="deleteAsNotHuman" :loading="deleting" prepend-icon="mdi-delete">
          Not a human? Delete from dataset
        </v-btn>
      </v-col>
    </v-row>

    <v-expansion-panels multiple>
      <v-expansion-panel v-for="group in fieldGroups" :key="group.title">
        <v-expansion-panel-title>{{ group.title }}</v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <template v-for="f in group.fields" :key="f.key">
              <v-col cols="12" md="6" v-if="f.type==='text' || f.type==='number'">
                <v-text-field
                  :type="f.type==='number' ? 'number' : 'text'"
                  v-model="form[f.key]"
                  :label="f.label"
                  density="compact"
                />
              </v-col>
              <v-col cols="12" md="6" v-else-if="f.type==='scale'">
                <v-select :items="f.items" v-model="form[f.key]" :label="f.label" density="compact" item-title="title" item-value="value" />
              </v-col>
              <v-col cols="12" md="6" v-else-if="f.type==='select'">
                <v-select :items="f.items" v-model="form[f.key]" :label="f.label" density="compact" />
              </v-col>
              <v-col cols="12" md="6" v-else-if="f.type==='boolean'">
                <v-checkbox v-model="form[f.key]" :label="f.label" :true-value="true" :false-value="false" />
              </v-col>
              <v-col cols="12" v-else-if="f.type==='textarea'">
                <v-textarea v-model="form[f.key]" :label="f.label" auto-grow />
              </v-col>
            </template>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-alert v-if="errorMsg" type="error" class="my-4">{{ errorMsg }}</v-alert>
    <v-btn type="submit" color="primary" :loading="saving" class="mt-4">Save</v-btn>
    <v-btn color="grey" class="mt-4 ml-2" @click="skip" :disabled="saving">Skip</v-btn>
  </v-form>
</template>

<style scoped>
</style>
