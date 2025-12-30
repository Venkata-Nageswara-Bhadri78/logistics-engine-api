const { timeStamp } = require("console");
const orderModels = require("../models/ordersModel");
const orderServices = require("../services/orderServices");

exports.createNewOrder = (req, res) => {
    const { customerName, pickupAddress, deliveryAddress, packageWeight } = req.body;
    const role = req.user.role;
    const id = req.user.id;

    // Validation Check
    if(role!=="ADMIN" && role!="CUSTOMER"){
        return res.status(403).json({success: false, orderId: null, message: "ACCESS DENIED"});
    }
    if(!customerName || !pickupAddress || !deliveryAddress || packageWeight === undefined || packageWeight === null){
        return res.status(404).json({success: false, orderId: null, message: "ALL FIELDS ARE REQUIRED TO PLACE AN ORDER"});
    }
    if(packageWeight <=0){
        return res.status(401).json({success: false, orderId: null, message: "PACKAGE WEIGHT SHOULD BE > 0 TO PLACE AN ORDER"});
    }
    const orderData = {
        customer_id: id,
        pickupAddress,
        deliveryAddress,
        packageWeight
    }
    orderModels.createNewOrder(orderData, (err, orderId) => {
        if(err){
            return res.status(500).json({success: false, message: "ERROR IN ORDER CREATION : "+err.message});
        }
        return res.status(201).json({success: true, orderId: orderId, message: "ORDER CREATED SUCESSFULLY"});
    })
}

exports.assignAgentForOrder = (req, res) => {
    const orderId = Number(req.params.id);
    const { agentId } = req.body;
    const role = req.user.role;
    const userId = req.user.id;

    if(role !== "ADMIN"){
        return res.status(403).json({success: false, message: "YOU DON'T HAVE ACCESS FOR ASSIGNING THE AGENT"});
    }
    if(isNaN(orderId)){
        return res.status(400).json({success: false, message: "INVALID ORDER ID"})
    }
    // Check Validation
    if(orderId === undefined || orderId === null || agentId === undefined || agentId === null){
        return res.status(400).json({success: false, message: "ORDER ID AND AGENT ID BOTH ARE REQUIRED"});
    }

    if (isNaN(orderId) || isNaN(agentId)) {
        return res.status(400).json({ success: false, message: "ORDER ID AND AGENT ID MUST BE NUMBERS"});
    }
    
    // Fetch Order
    orderModels.assignAgent(orderId, agentId, userId, (err, message) => {
        if(err){
            return res.status(400).json({success: false, message: message});
        }
        return res.status(200).json({success: true, message: message});
        
    });
}

exports.updateOrderStatus = async (req, res) => {
    try{
        const userRole = req.user.role;
        const userId = req.user.id;
        const status = req.body.status?.toUpperCase();
        const orderId = Number(req.params.id);
        // check for validation
        if(!orderServices.isValidStatus(status)){
            return res.status(400).json({success: false, message: "INVALID STATUS"});
        }

        if(userRole!=="ADMIN" && userRole!=="AGENT"){
            return res.status(403).json({success: false, message: "YOU DON'T HAVE ACCESS TO UPDATE THE STATUS"});
        }

        const order = await orderModels.getOrderById(orderId);
        
        if(!order){
            return res.status(404).json({success: false, message: "INVALID ORDER ID"});
        }
        
        if (userRole === "AGENT" && order.agentId !== userId) {
            return res.status(403).json({success: false, message: "YOU CAN UPDATE ONLY YOUR OWN ORDERS"});
        }

        if (order.status === status) {
            return res.status(400).json({ message: "ORDER ALREADY IN THIS STATUS" });
        }          

        if(!orderServices.isValidOrderStatusUpdate(order.status, status)){
            return res.status(400).json({success: false, message: "INVALID STATUS OF ORDER"});
        }

        await orderModels.updateOrderStatus(status, orderId);

        orderModels.updateOrderHistory(orderId, status, userId, (err, message) => {
            if(err){
                return res.status(500).json({success: false, message: message});
            }
            return res.status(200).json({success: true, message: "ORDER STATUS UPDATED SUCCESSFULLY"});
        });
    }
    catch(err){
        return res.status(500).json({success: false, message: err.message});
    }
}


exports.getOrderHistory = async (req, res) => {
    try{
        const userRole = req.user.role;
        const orderId = Number(req.params.id);
        const userId = req.user.id;

        if(userRole!=="ADMIN" && userRole!=="CUSTOMER" && userRole!=="AGENT"){
            return res.status(403).json({success: false, data: null, message: "INVALID USER ROLE"});
        }
        if (!orderId || isNaN(orderId)) {
            return res.status(400).json({success: false, data: null, message: "INVALID ORDER ID"});
        }
        
        const orderDetails  = await orderModels.getOrderById(orderId);
        if(!orderDetails){
            return res.status(404).json({success: false, data: null, message: "INVALID ORDER OR ORDER NOT FOUND"});
        }
        // if(orderDetails.customerId !== userId && orderDetails.agentId !== userId){
        //     return res.status(403).json({success: false, data: null, message: "ACCESS DENIED - YOU DON'T HAVE ACCESS FOR GETTING ORDER DETAILS"});
        // }
        if (userRole !== "ADMIN" && orderDetails.customerId !== userId && orderDetails.agentId !== userId) {
            return res.status(403).json({ success: false, data: null, message: "ACCESS DENIED"});
        }
        
          
        const orderHistory = await orderModels.getOrderHistoryById(orderId);
        if(!orderHistory){
            return res.status(404).json({success: false, data: null, message: "NO ORDER HISTORY FOUND"});
        }
        const mappedOrderHistory = orderHistory.map((a) => {
            return {status: a.status, timeStamp: a.changedAt}
        })
        return res.status(200).json({success: true, data: mappedOrderHistory, message: "ORDER HISTORY FOUND"});
    }
    catch(err){
        return res.status(500).json({success: false, data: null, message: "SERVER ERROR"});
    }
}

exports.getAllEligibleOrders = async (req, res) => {
    try{
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

        const status= req.query.status ? req.query.status.toUpperCase() : null;

        const ordersData = await orderModels.getAllEligibleOrders(req.user.id, req.user.role, page, limit, status);
        if(!ordersData){
            return res.status(400).json({success: false, data: null, message: "NO DATA FOUND WITH GIVEN QUERIES"});
        }
        const finalData = {
            success: true,
            ...ordersData
        }
        
        return res.status(200).json(finalData);
    }
    catch(err){
        return res.status(500).json({success: false, data: null, message: "INTERNAL SERVER ISSUE"})
    }
}

exports.getDetailedOrderInfo = async (req, res) => {
    try{
        const orderId = Number(req.params.id);
        if(!orderId || isNaN(orderId)){
            return res.status(400).json({success: false, data: null, message: "INVALID ORDER ID"});
        }
        const orderInfo = await orderModels.getOrderById(orderId);
        if(!orderInfo){
            return res.status(404).json({success: false, data: null, message: "NO ORDER FOUND WITH GIVEN ID"});
        }
        if(req.user.role==="ADMIN" || (req.user.role==="AGENT" && orderInfo.agentId===req.user.id) || (req.user.role==="CUSTOMER" && orderInfo.customerId===req.user.id)){
            // ACESS FOR ANY ORDER
            const orderHistory = await orderModels.getOrderHistoryById(orderId);
            const combinedData = {
                success: true,
                data: {
                    order: orderInfo,
                    history: orderHistory
                }
            }
            return res.status(200).json(combinedData);
        }
        return res.status(403).json({success: false, data: null, message: "YOU DON'T HAVE ACCESS FOR THIS ACTION"});
    }
    catch(err){
        return res.status(500).json({success: false, data: null, message: "SERVER ERROR"})
    }
}

exports.fetchOrdersOfCustomer = async (req, res) => {
    try{
        const customerId = Number(req.params.id);
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 10);
        
        if(req.user.role==="AGENT"){
            return res.status(403).json({success: false, data: null, message: "ACCESS DENIED"})
        }
        if(req.user.role==="CUSTOMER" && req.user.id!==customerId){
            return res.status(403).json({success: false, data: null, message: "ACCESS DENIED"});
        }
        const customerOrders = await orderModels.getAllEligibleOrders(customerId, "CUSTOMER", page, limit, null);
        
        if(customerOrders.totalRecords===0){
            return res.status(200).json({success: true, page, limit, totalRecords: 0, totalPages: 0, data: []});
        }
        const ordersOfUser = {
            success: true,
            ...customerOrders
        }
        return res.status(200).json(ordersOfUser);
    }
    catch(err){
        return res.status(500).json({success: false, data: null, message: "SERVER ERROR"});
    }
}

exports.fetchOrdersAssignedToAgents = async (req, res) => {
    try{
        const agentId = Number(req.params.id);
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 10);

        if(req.user.role==="CUSTOMER"){
            return res.status(403).json({success: false, data: null, message: "ACCESS DENIED"});
        }
        if(req.user.role==="AGENT" && req.user.id!==agentId){
            return res.status(403).json({success: false, data: null, message: "ACCESS DENIED"});
        }
        const agentOrders = await orderModels.getAllEligibleOrders(agentId, "AGENT", page, limit, null);
        if(agentOrders.totalRecords===0){
            return res.status(200).json({success: true, page, limit, totalRecords: 0, totalPages: 0, data: []});
        }

        return res.status(200).json({success: true, ...agentOrders});

    }
    catch(err){
        return res.status(500).json({success: false, data: null, message: "SERVER ERROR"});
    }
}