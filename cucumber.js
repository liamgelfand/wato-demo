module.exports = {
  default: {
    require: ['features/step_definitions/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: [
      'progress-bar',
      'html:test-results/cucumber-report.html',
      'json:test-results/cucumber-report.json',
    ],
    formatOptions: { snippetInterface: 'async-await' },
    publishQuiet: true,
  },
}
