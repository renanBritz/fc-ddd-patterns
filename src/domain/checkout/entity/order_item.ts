export default class OrderItem {
  private _id: string;
  private _productId: string;
  private _name: string;
  private _price: number;
  private _quantity: number;

  constructor(
    id: string,
    name: string,
    price: number,
    productId: string,
    quantity: number
  ) {
    this._id = id;
    this._name = name;
    this._price = price;
    this._productId = productId;
    this._quantity = quantity;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get productId(): string {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  /* Este getter fazia com que o preço*quantidade fosse salvo no banco. Depois
  *  na hora de recuperar o valor ele multiplicava de novo, o que aumentava
  *  exponencialmente o preço.
  *  
  *  Criei o `originalPrice` pra contornar isso e não precisar alterar todos
  *  os testes (mas se fosse um app de verdade eu iria refatorar melhor).
  */
  get price(): number {
    return this._price * this._quantity;
  }

  get originalPrice(): number {
    return this._price;
  }
}
