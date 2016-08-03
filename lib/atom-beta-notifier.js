'use babel'

import AtomBetaNotifierView from './atom-beta-notifier-view'
import { CompositeDisposable } from 'atom'
import semver from 'semver'

const apiReleasesURL = 'http://api.github.com/repos/atom/atom/releases'
const downloadURL = 'https://atom.io/download/rpm?channel=beta'

export default {

  atomBetaNotifierView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.atomBetaNotifierView = new AtomBetaNotifierView(state.atomBetaNotifierViewState)
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomBetaNotifierView.getElement(),
      visible: false
    })

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-beta-notifier:check': () => this.check()
    }))
  },

  deactivate() {
    this.modalPanel.destroy()
    this.subscriptions.dispose()
    this.atomBetaNotifierView.destroy()
  },

  serialize() {
    return {
      atomBetaNotifierViewState: this.atomBetaNotifierView.serialize()
    }
  },

  notify(payload) {
    const currentVersion = atom.getVersion()
    const latestBeta = payload.filter(release => release.prerelease)[0].tag_name
    const latestStable = payload.filter(release => !release.prerelease)[0].tag_name
    const runningBeta = currentVersion.indexOf('beta') > 0
    const an = atom.notifications
    let showNotification = an.addInfo
    if (semver.gt(latestStable, currentVersion)) {
      showNotification = an.addError
    } else if (semver.gt(latestBeta, currentVersion)) {
      showNotification = runningBeta ? an.addError : an.addWarning
    }
    console.log('F: ', showNotification)
    showNotification.call(
      an,
      `Latest beta is <a href=${downloadURL}><strong>${latestBeta}</strong></a>\n`,
      {
        detail: `You are running version ${currentVersion}\n` +
                `Letest stable is ${latestStable}`,
        dismissable: true,
      }
    )
  },

  check() {
    fetch(apiReleasesURL)
      .then(response => response.json())
      .then(json => this.notify(json))
      .catch(error => console.error('Error while fetching released from GitHub', error))
  }

}
