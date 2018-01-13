
import { Component, Input } from '@angular/core';

@Component({
    selector: 'offers-table',
    template:`
<table class="table table-striped">
<thead>
    <tr>
        <th scope="col">Item</th>
        <th scope="col"></th>                        
        <th scope="col">Price</th>
        <th scope="col">Description</th>
    </tr>
</thead>
<tbody>
    <tr *ngFor="let olxOffer of pagedOffers;">
        <td>
            <a target="_blank" href="{{olxOffer.offerUrl}}">
                <img height="40px" width="40px" src="{{olxOffer.offerImage}}" alt="">
            </a>
        </td>
        <td><a class="btn btn-default"><span class="glyphicon glyphicon-heart"></span></a></td>                        
        
        <td>{{olxOffer.offerPrice}}</td>
        <td>{{olxOffer.offerDescription}}</td>
    </tr>
</tbody>
</table>
`
})

export class OffersTableComponent {
    @Input() pagedOffers;
}