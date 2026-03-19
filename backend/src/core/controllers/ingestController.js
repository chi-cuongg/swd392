const ingestService = require('../services/ingestService');

/**
 * Controller layer - handles HTTP request/response
 * Business logic is delegated to ingestService
 */

exports.ingestData = async(req, res) => {
    try {
        const { organizationId, organizationSlug, deviceId, deviceName, domain, metrics, status, message } = req.body;

        // Call service to handle business logic
        const result = await ingestService.ingestData(
            organizationId,
            organizationSlug,
            deviceId,
            deviceName,
            domain,
            metrics,
            status,
            message
        );

        // Emit WebSocket events
        const orgRoom = `org:${result.organizationId}`;
        const domainRoom = `org:${result.organizationId}:domain:${domain}`;

        const payload = {
            organizationId: result.organizationId,
            deviceId,
            domain,
            metrics: result.metrics,
            status: result.status,
            message: result.message,
            timestamp: result.timestamp
        };

        req.io.to(orgRoom).emit('device_update', payload);
        req.io.to(domainRoom).emit('device_update', payload);
        req.io.emit('device_update', payload);

        if (result.alerts.length > 0) {
            req.io.to(orgRoom).emit('alert_created', result.alerts);
            req.io.to(domainRoom).emit('alert_created', result.alerts);
        }

        // Return success response
        res.status(200).json({
            success: true,
            organizationId: result.organizationId,
            deviceId,
            domain,
            status: result.status,
            alertCount: result.alerts.length
        });
    } catch (error) {
        console.error('Ingest Error:', error);
        
        // Handle error with proper status code
        const status = error.status || 500;
        const message = error.message || 'Internal Server Error';
        
        res.status(status).json({
            success: false,
            error: message,
            ...(error.details && { details: error.details })
        });
    }
};