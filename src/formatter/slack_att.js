// Module to generate Slack attachments for robot.adapter.customMessage
const _ = require('lomath')


// The predefined color palette
const palette = {
  good: 'good',
  warning: 'warning',
  danger: 'danger',
  red: 'danger',
  pink: '#ff4081',
  violet: '#ab47bc',
  purple: '#7e57c2',
  indigo: '#3f51b5',
  blue: '#42a5f5',
  cyan: '#18ffff',
  teal: '#64ffda',
  green: 'good',
  yellow: 'warning',
  orange: '#ffa726',
  brown: '#795548',
  grey: '#546e7a',
}

// quick function to get color from palette
/* istanbul ignore next */

function getColor(str) {
  return _.get(palette, str.toLowerCase())
}

// sample simple attachment
// keys can be missing
const sampleAtt = {
  // color can be "good", "warning", "danger", hex #439FE0
  color: 'good',
  pretext: 'This is a pretext',
  title: 'This is a title',
  title_link: 'https://api.slack.com/docs/attachments',
  text: 'This is the main text in a message attachment',
  fieldMat: [
    // the "short" key defaults to true
    ['Priority', 'high'],
    ['Status', 'pending'],
  ],
  image_url: 'https://slack.global.ssl.fastly.net/ae57/img/slack_api_logo.png',
  thumb_url: 'https://slack.global.ssl.fastly.net/ae57/img/slack_api_logo.png',
}

// console.log(gen({ message: { room: 'kengz' } }, att))

/**
 * Helper method to clean the deeper fieldMat: remove rows where row[1] is falsy.
 * @param  {Array} fieldMat The fieldMat of slack attachment
 * @return {Array}          The cleaned matrix.
 */
/* istanbul ignore next */

function cleanFieldMat(fieldMat) {
  const cleanMap = _.map(fieldMat, row => (row[1] ? row : null))
  return _.compact(cleanMap)
}

/**
 * Generates the JSON attachment payload for Slack's robot.adapter.customMessage from a simplified JSON attachment object. Refer to https://api.slack.com/docs/attachments for details.
 * @param  {JSON} att A simplified attachment object
 * @return {JSON}            The attachment object.
 */
/* istanbul ignore next */

function genAttach(rawAtt) {
  let att = rawAtt

  // cleanup the fieldmat
  att.fieldMat = cleanFieldMat(att.fieldMat)

  // filter out undefined values
  att = _.pickBy(att)

  // the 3 keys for each field
  const fieldKeys = ['title', 'value', 'short']
  let fields = _.map(att.fieldMat, (fieldArr) => {
    fieldArr.push(true)
    return _.zipObject(fieldKeys, fieldArr)
  })

  // make null if is empty
  fields = _.isEmpty(fields) ? null : fields

  // filter out null values
  return _.pickBy({
    fallback: _.join(_.compact([att.pretext, att.title, att.title_link]), ' - '),
    color: getColor(att.color),
    pretext: att.pretext,
    title: att.title,
    title_link: att.title_link,
    text: att.text,
    fields,
    image_url: att.image_url,
    thumb_url: att.thumb_url,
  })
}

/**
 * Generates the JSON message object for Slack's robot.adapter.customMessage,
 * on taking robot's res and multiple simple objs.
 * @param  {*} res robot's response object.
 * @param  {JSON|Array|*} att Simplified attachment object(s)
 * or an array of them, or any result to be parsed
 * @param  {Function} Parser (batch) that will be applied to atts, if specified.
 * @return {JSON}     The message object for Slack's robot.adapter.customMessage
 * @example
 * gen(res, gkgseachRes, slackAtt.gkgParser)
 * // => gkgsearchRes as array of Slack attachments
 */
/* istanbul ignore next */

function gen(res, atts, parser) {
  let parsedAtts = atts
  if (parser) {
    // apply parser directly if specified
    parsedAtts = parser(parsedAtts)
  } else if (!_.isArray(parsedAtts)) {
    // no parser, ensure parsedAtts is an array of attachment JSONs
    parsedAtts = [parsedAtts]
  }
  return {
    channel: res.message.room,
    attachments: _.map(parsedAtts, genAttach),
  }
}


// ////////////////////////////////////////////
// The parsers into Slack attachment format //
// ////////////////////////////////////////////

/**
 * Unit parser for google knowledge graph result to slack attachment
 */
/* istanbul ignore next */

function subGkgParser(item) {
  const att = {
    color: 'purple',
    pretext: _.get(item, 'result.description'),
    title: _.get(item, 'result.name'),
    title_link: _.get(item, 'result.detailedDescription.url'),
    text: _.get(item, 'result.detailedDescription.articleBody'),
    fieldMat: [
      // the "short" key defaults to true
      ['Type', _.join(_.get(item, 'result.@type'), ', '), false],
    ],
    thumb_url: _.get(item, 'result.image.contentUrl'),
  }
  return att
}

/**
 * Parser for google knowledge graph into slack attachments
 * @param  {JSON} gkgRes Result from google.kgsearch()
 * @return {Array}        Of Slack attachments
 * @example
 * gen(res, gkgseachRes, slackAtt.gkgParser)
 * // => gkgsearchRes as array of Slack attachments
 *
 */
/* istanbul ignore next */

function gkgParser(gkgRes) {
  const items = (gkgRes.itemListElement || [])
  return _.map(items, subGkgParser)
}

/**
 * Unit parser for google knowledge graph result to slack attachment
 */
/* istanbul ignore next */

function subGsearchParser(item) {
  if (!_.get(item, 'href')) {
    return null
  }
  const att = {
    color: 'indigo',
    title: _.get(item, 'title'),
    title_link: _.get(item, 'href'),
    text: _.get(item, 'description'),
    fieldMat: [
      // the "short" key defaults to true
      ['url', _.get(item, 'link'), false],
    ],
  }
  return att
}

/**
 * Parser for google knowledge graph into slack attachments
 * @param  {JSON} gsearchRes Result from google.gsearch()
 * @return {Array}        Of Slack attachments
 * @example
 * gen(res, gseachRes, slackAtt.gsearchParser)
 * // => gsearchRes as array of Slack attachments
 *
 */
/* istanbul ignore next */

function gsearchParser(gsearchRes) {
  const items = (gsearchRes.links || [])
  return _.compact(_.map(items, subGsearchParser))
}


module.exports = {
  sampleAtt,
  gen,
  gkgParser,
  gsearchParser,
}
