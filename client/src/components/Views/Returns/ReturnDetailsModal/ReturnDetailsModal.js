import React, { useState, useEffect } from "react"
import { Modal, Button, Tab, Tabs, Table, Alert, Spinner, Badge } from "react-bootstrap"
import Styles from "./ReturnDetailsModal.module.scss"

const ReturnDetailsModal = ({ show, onHide, itemId }) => {
  const [loading, setLoading] = useState(false)
  const [returnData, setReturnData] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (show && itemId) {
      fetchReturnDetails()
    }
  }, [show, itemId])

  const fetchReturnDetails = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/ebay/getReturnDetails/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setReturnData(data)
      } else {
        setError(data.message || "Failed to fetch return details")
      }
    } catch (err) {
      setError("Network error while fetching return details")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  const formatCurrency = (amount, currency = "USD") => {
    if (!amount) return "N/A"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      'RETURN_REQUESTED': 'warning',
      'RETURN_APPROVED': 'info',
      'RETURN_SHIPPED': 'primary',
      'RETURN_RECEIVED': 'success',
      'RETURN_CLOSED': 'secondary',
      'REFUND_COMPLETED': 'success',
      'REFUND_PENDING': 'warning',
      'DELIVERED': 'success',
      'IN_TRANSIT': 'primary',
      'SHIPPED': 'info'
    }
    
    return (
      <Badge bg={statusColors[status] || 'secondary'}>
        {status?.replace(/_/g, ' ') || 'Unknown'}
      </Badge>
    )
  }

  const renderOverviewTab = () => {
    const { inventoryItem, returnDetails } = returnData

    return (
      <div className={Styles.tabContent}>
        {/* Basic Item Information */}
        <div className={Styles.section}>
          <h5>Item Information</h5>
          <Table striped bordered size="sm">
            <tbody>
              <tr>
                <td><strong>Title:</strong></td>
                <td>{inventoryItem.title}</td>
              </tr>
              <tr>
                <td><strong>SKU:</strong></td>
                <td>{inventoryItem.sku}</td>
              </tr>
              <tr>
                <td><strong>Part Number:</strong></td>
                <td>{inventoryItem.partNo || "N/A"}</td>
              </tr>
              <tr>
                <td><strong>Purchase Price:</strong></td>
                <td>${inventoryItem.purchasePrice?.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Sale Price:</strong></td>
                <td>${inventoryItem.priceSold?.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Buyer:</strong></td>
                <td>{inventoryItem.buyer || "N/A"}</td>
              </tr>
            </tbody>
          </Table>
        </div>

        {/* Return Status */}
        <div className={Styles.section}>
          <h5>Return Status</h5>
          <Table striped bordered size="sm">
            <tbody>
              <tr>
                <td><strong>Return Type:</strong></td>
                <td>
                  <Badge bg={inventoryItem.automaticReturn ? 'success' : 'info'}>
                    {inventoryItem.automaticReturn ? 'Automatic' : 'Manual'}
                  </Badge>
                </td>
              </tr>
              <tr>
                <td><strong>Current Status:</strong></td>
                <td>{getStatusBadge(inventoryItem.ebayReturnStatus || inventoryItem.status)}</td>
              </tr>
              <tr>
                <td><strong>Return Date:</strong></td>
                <td>{formatDate(inventoryItem.returnDate)}</td>
              </tr>
              {inventoryItem.returnDeliveredDate && (
                <tr>
                  <td><strong>Delivered Date:</strong></td>
                  <td>{formatDate(inventoryItem.returnDeliveredDate)}</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* eBay Return Information */}
        {inventoryItem.ebayReturnId && (
          <div className={Styles.section}>
            <h5>eBay Return Details</h5>
            <Table striped bordered size="sm">
              <tbody>
                <tr>
                  <td><strong>eBay Return ID:</strong></td>
                  <td>{inventoryItem.ebayReturnId}</td>
                </tr>
                <tr>
                  <td><strong>Return Reason:</strong></td>
                  <td>{inventoryItem.ebayReturnReason || "N/A"}</td>
                </tr>
                {inventoryItem.ebayBuyerComments && (
                  <tr>
                    <td><strong>Buyer Comments:</strong></td>
                    <td>{inventoryItem.ebayBuyerComments}</td>
                  </tr>
                )}
                <tr>
                  <td><strong>Last Sync:</strong></td>
                  <td>{formatDate(inventoryItem.ebayLastSync)}</td>
                </tr>
              </tbody>
            </Table>
          </div>
        )}

        {/* Financial Information */}
        <div className={Styles.section}>
          <h5>Financial Summary</h5>
          <Table striped bordered size="sm">
            <tbody>
              {inventoryItem.ebayRefundAmount && (
                <>
                  <tr>
                    <td><strong>Refund Amount:</strong></td>
                    <td>{formatCurrency(inventoryItem.ebayRefundAmount)}</td>
                  </tr>
                  <tr>
                    <td><strong>Refund Status:</strong></td>
                    <td>{getStatusBadge(inventoryItem.ebayRefundStatus)}</td>
                  </tr>
                  {inventoryItem.ebayRefundDate && (
                    <tr>
                      <td><strong>Refund Date:</strong></td>
                      <td>{formatDate(inventoryItem.ebayRefundDate)}</td>
                    </tr>
                  )}
                </>
              )}
              {inventoryItem.additionalCosts?.length > 0 && (
                <tr>
                  <td><strong>Return Shipping Cost:</strong></td>
                  <td>
                    ${inventoryItem.additionalCosts
                      .find(cost => cost.title === "returnShippingCost")
                      ?.amount?.toFixed(2) || "0.00"}
                  </td>
                </tr>
              )}
              <tr>
                <td><strong>Final Profit/Loss:</strong></td>
                <td className={inventoryItem.profit < 0 ? Styles.negative : Styles.positive}>
                  ${inventoryItem.profit?.toFixed(2) || inventoryItem.expectedProfit?.toFixed(2) || "0.00"}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
    )
  }

  const renderTrackingTab = () => {
    const { inventoryItem, trackingDetails } = returnData

    if (!inventoryItem.ebayTrackingNumber) {
      return (
        <div className={Styles.tabContent}>
          <Alert variant="info">
            No tracking information available for this return.
          </Alert>
        </div>
      )
    }

    return (
      <div className={Styles.tabContent}>
        <div className={Styles.section}>
          <h5>Shipping Information</h5>
          <Table striped bordered size="sm">
            <tbody>
              <tr>
                <td><strong>Carrier:</strong></td>
                <td>{inventoryItem.ebayCarrierUsed || "N/A"}</td>
              </tr>
              <tr>
                <td><strong>Tracking Number:</strong></td>
                <td>{inventoryItem.ebayTrackingNumber}</td>
              </tr>
              <tr>
                <td><strong>Tracking Status:</strong></td>
                <td>{getStatusBadge(inventoryItem.ebayTrackingStatus)}</td>
              </tr>
            </tbody>
          </Table>
        </div>

        {trackingDetails && trackingDetails.scanHistory && (
          <div className={Styles.section}>
            <h5>Tracking History</h5>
            <div className={Styles.trackingHistory}>
              {trackingDetails.scanHistory.map((scan, index) => (
                <div key={index} className={Styles.trackingEvent}>
                  <div className={Styles.eventDate}>
                    {formatDate(scan.eventTime?.value)}
                  </div>
                  <div className={Styles.eventDetails}>
                    <strong>{scan.eventDesc}</strong>
                    <div className={Styles.eventLocation}>
                      {scan.eventCity}, {scan.eventStateOrProvince} {scan.eventPostalCode}
                    </div>
                    <div className={Styles.eventStatus}>
                      Status: {getStatusBadge(scan.eventStatus)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderRawDataTab = () => {
    const { returnDetails } = returnData

    if (!returnDetails) {
      return (
        <div className={Styles.tabContent}>
          <Alert variant="info">
            No detailed eBay return data available. This may be a manually processed return.
          </Alert>
        </div>
      )
    }

    return (
      <div className={Styles.tabContent}>
        <div className={Styles.section}>
          <h5>Raw eBay Return Data</h5>
          <pre className={Styles.jsonData}>
            {JSON.stringify(returnDetails, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Return Details</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading && (
          <div className={Styles.loading}>
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p>Loading return details...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {returnData && !loading && (
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="overview" title="Overview">
              {renderOverviewTab()}
            </Tab>
            
            <Tab eventKey="tracking" title="Tracking">
              {renderTrackingTab()}
            </Tab>
            
            <Tab eventKey="raw" title="Raw Data">
              {renderRawDataTab()}
            </Tab>
          </Tabs>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ReturnDetailsModal 