import { Op } from "sequelize";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.originalPrice,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        total: entity.total(),
      },
      {
        where: { id: entity.id },
      }
    );

    const itemIds: string[] = [];

    entity.items.forEach(async (orderItem) => {
      itemIds.push(orderItem.id);

      await OrderItemModel.upsert({
        id: orderItem.id,
        name: orderItem.name,
        price: orderItem.price,
        product_id: orderItem.productId,
        quantity: orderItem.quantity,
        order_id: entity.id,
      });
    });

    OrderItemModel.destroy({
      where: { order_id: entity.id, id: { [Op.notIn]: itemIds } },
    });
  }

  async find(id: string): Promise<Order> {
    const orderModel = await OrderModel.findOne({
      where: { id },
      include: ["items"],
    });

    return new Order(
      orderModel.id,
      orderModel.customer_id,
      orderModel.items.map(
        (orderItem) =>
          new OrderItem(
            orderItem.id,
            orderItem.name,
            orderItem.price,
            orderItem.product_id,
            orderItem.quantity
          )
      )
    );
  }

  async findAll(): Promise<Order[]> {
    const modelOrders = await OrderModel.findAll({ include: ["items"] });

    return modelOrders.map(
      (modelOrder) =>
        new Order(
          modelOrder.id,
          modelOrder.customer_id,
          modelOrder.items.map(
            (item) =>
              new OrderItem(
                item.id,
                item.name,
                item.price,
                item.product_id,
                item.quantity
              )
          )
        )
    );
  }
}
