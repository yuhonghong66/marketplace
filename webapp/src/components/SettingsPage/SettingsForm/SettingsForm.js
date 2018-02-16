import React from 'react'
import PropTypes from 'prop-types'
import { txUtils } from 'decentraland-commons'

import { Form } from 'semantic-ui-react'
import EtherscanLink from 'components/EtherscanLink'
import TxStatus from 'components/TxStatus'

import { getManaToApprove, getMarketplaceAddress } from 'modules/wallet/utils'

import './SettingsForm.css'

const MANA_TO_APPROVE = getManaToApprove()

export default class SettingsForm extends React.PureComponent {
  static propTypes = {
    address: PropTypes.string,
    email: PropTypes.string,
    manaApproved: PropTypes.number,
    approveTransaction: PropTypes.object,
    onManaApprovedChange: PropTypes.func,
    isLandAuthorized: PropTypes.bool,
    authorizeTransaction: PropTypes.object,
    onLandAuthorizedChange: PropTypes.func
  }

  static defaultProps = {
    address: '',
    email: '',
    approveTransaction: {},
    authorizeTransaction: {}
  }

  render() {
    const {
      address,
      manaApproved,
      approveTransaction,
      onManaApprovedChange,
      isLandAuthorized,
      authorizeTransaction,
      onLandAuthorizedChange
    } = this.props

    const isApprovePending = txUtils.isPending(approveTransaction)
    const isAuthorizePending = txUtils.isPending(authorizeTransaction)

    const isPending = isApprovePending || isAuthorizePending

    return (
      <Form className={`SettingsForm ${isPending ? 'tx-pending' : ''}`}>
        <Form.Field>
          <Form.Field
            id="wallet-address"
            control="input"
            type="text"
            label="Wallet address"
            disabled={true}
            value={address}
          />
        </Form.Field>

        <Form.Field>
          <input
            type="checkbox"
            checked={manaApproved > 0}
            disabled={isApprovePending}
            data-balloon={
              isApprovePending
                ? 'You have a pending transaction'
                : manaApproved > 0
                  ? 'Unchecking will approve 0 MANA'
                  : `Check to approve ${MANA_TO_APPROVE} MANA`
            }
            data-balloon-pos="left"
            onChange={onManaApprovedChange}
          />

          {manaApproved > 0 ? (
            <p className="authorize-detail">
              You have {manaApproved} MANA approved to be used by the contract.<br />
              {!isApprovePending &&
                manaApproved < MANA_TO_APPROVE && (
                  <span
                    className="link"
                    data-balloon={`You will authorize ${MANA_TO_APPROVE.toLocaleString()} MANA`}
                    data-balloon-pos="up"
                    onClick={onManaApprovedChange}
                  >
                    Approve more
                  </span>
                )}
            </p>
          ) : (
            <p className="authorize-detail">
              Approve {MANA_TO_APPROVE.toLocaleString()} MANA usage for
              the&nbsp;
              <EtherscanLink address={getMarketplaceAddress()}>
                Marketplace contract
              </EtherscanLink>
            </p>
          )}

          <TxStatus.Text
            txHash={approveTransaction.hash}
            txStatus={approveTransaction.status}
          />
        </Form.Field>

        <Form.Field>
          <input
            type="checkbox"
            checked={isLandAuthorized || false}
            disabled={isAuthorizePending}
            data-balloon={
              isAuthorizePending
                ? 'You have a pending transaction'
                : manaApproved > 0
                  ? 'Unchecking unauthorizes LAND usage for the Marketplace contract'
                  : 'Checking authorizes LAND usage to the Marketplace contract'
            }
            data-balloon-pos="left"
            onChange={onLandAuthorizedChange}
          />

          <p className="authorize-detail">
            {isLandAuthorized ? (
              <span>
                You have authorized the&nbsp;
                <EtherscanLink address={getMarketplaceAddress()}>
                  Marketplace contract
                </EtherscanLink>
                &nbsp;to operate LAND on your behalf
              </span>
            ) : (
              <span>
                Authorize the&nbsp;
                <EtherscanLink address={getMarketplaceAddress()}>
                  Marketplace contract
                </EtherscanLink>
                &nbsp;to operate LAND on your behalf
              </span>
            )}
          </p>

          <TxStatus.Text
            txHash={authorizeTransaction.hash}
            txStatus={authorizeTransaction.status}
          />
        </Form.Field>
      </Form>
    )
  }
}
