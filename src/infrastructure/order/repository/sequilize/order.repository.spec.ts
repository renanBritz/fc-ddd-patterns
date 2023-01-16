import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";
import { v4 as uuid } from "uuid";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  const createBaseOrder = async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer(uuid(), "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product(uuid(), "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      uuid(),
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order(uuid(), customer.id, [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    return { order, orderItem, product };
  };

  it("should create a new order", async () => {
    const { order, orderItem } = await createBaseOrder();

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: order.customerId,
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.originalPrice,
          quantity: orderItem.quantity,
          order_id: order.id,
          product_id: orderItem.productId,
        },
      ],
    });
  });

  it("should update an existing order", async () => {
    const { order, product } = await createBaseOrder();
    
    const orderRepository = new OrderRepository();

    const updatedItem = new OrderItem(
      uuid(),
      product.name,
      product.price,
      product.id,
      3 // Changed qty
    );

    order.updateItems([updatedItem]);
    await orderRepository.update(order);

    const updatedOrder = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(updatedOrder.toJSON()).toStrictEqual({
      id: order.id,
      customer_id: order.customerId,
      total: order.total(),
      items: [
        {
          id: updatedItem.id,
          name: updatedItem.name,
          price: updatedItem.price,
          quantity: updatedItem.quantity,
          order_id: order.id,
          product_id: product.id,
        },
      ],
    });
  });

  it("should find an order", async () => {
    const { order } = await createBaseOrder();
    const orderRepository = new OrderRepository();

    const locatedOrder = await orderRepository.find(order.id);
    const modelOrder = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(modelOrder.toJSON()).toStrictEqual({
      id: locatedOrder.id,
      customer_id: locatedOrder.customerId,
      total: locatedOrder.total(),
      items: [
        {
          id: locatedOrder.items[0].id,
          name: locatedOrder.items[0].name,
          price: locatedOrder.items[0].originalPrice,
          quantity: locatedOrder.items[0].quantity,
          order_id: locatedOrder.id,
          product_id: locatedOrder.items[0].productId,
        },
      ],
    });
  });

  it("should find all orders", async () => {
    await Promise.all([
      createBaseOrder(),
      createBaseOrder(),
      createBaseOrder(),
    ]);

    const orderRepository = new OrderRepository();
    const allOrders = await orderRepository.findAll();
    const modelOrders = await OrderModel.findAll({ include: ["items"] });

    modelOrders.forEach((modelOrder, i) =>
      expect(modelOrder.toJSON()).toStrictEqual({
        id: allOrders[i].id,
        customer_id: allOrders[i].customerId,
        total: allOrders[i].total(),
        items: [
          {
            id: allOrders[i].items[0].id,
            name: allOrders[i].items[0].name,
            price: allOrders[i].items[0].originalPrice,
            quantity: allOrders[i].items[0].quantity,
            order_id: allOrders[i].id,
            product_id: allOrders[i].items[0].productId,
          },
        ],
      })
    );
  });
});
