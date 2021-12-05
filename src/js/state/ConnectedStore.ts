import {
    atom,
    AtomEffect,
    atomFamily,
    AtomFamilyOptions,
    AtomOptions,
    ReadOnlySelectorOptions,
    RecoilState,
    RecoilValueReadOnly,
    selector,
    SetterOrUpdater
} from "recoil";


type SelectorKey = string|number;
type StoreEntryType = 'atomfamily'|'atom'|'selector'|'selectorfamily';
type StoreEntry<T> = { setter: SetterOrUpdater<T>, state: RecoilState<T>|RecoilValueReadOnly<T>, val:T , type:StoreEntryType};
type StoreDictionary = { [key: string]: StoreEntry<any> };
type StoreUninitializedValuesDictionary = { [key: string]: any };
/**
 * Store that contains all atoms and selectors created by using connectedSelector and connectedAtom
 * This is a global store, so currently it will not work with multiple RecoilRoots.
 * The only thing that needs to be done in order for the Store to become intialized is a component within a RecoilRoot
 * that calls updateInContext and passes itself as the context.
 */
class ConnectedStore {
	store: StoreDictionary;
	preInitValues: StoreUninitializedValuesDictionary;
	enableLogging:boolean = false;
	
	constructor() {
		this.store = {};
		this.preInitValues = {};
	}
	
	// export function connectedAtomFamily<T, P extends SerializableParam>(options: AtomFamilyOptions<T, P>): (param: P) => ConnectedState<T>{ return atomFamily(options);}
	// export function connectedSelector<T>(options: ReadWriteSelectorOptions<T>): ConnectedState<T> { return selector<T>(options);}
	// export function connectedSelectorFamily<T,P extends SerializableParam>(options: ReadWriteSelectorFamilyOptions<T,P>): (param: P) => ConnectedState<T> { return selectorFamily<T,P>(options);}
	
	
	getAtomFromStore<T>(options: AtomOptions<T>):RecoilState<T>{
		options.effects_UNSTABLE = [this.getInitEffect(options.default,'atom')];
		return atom(options);
	}
	// @ts-ignore
	getAtomFamilyFromStore<T, P>(options: AtomFamilyOptions<T,P>):(param:P)=>RecoilState<T>{
		options.effects_UNSTABLE = [this.getInitEffect(options.default,'atomfamily')];
		// @ts-ignore
		return atomFamily(options);
	}
	// @ts-ignore
	// getSelectorFamilyFromStore<T, P>(options: ReadWriteSelectorFamilyOptions<T,P>): (param: P) => RecoilState<T> {
	//
	// 	//We do not use Recoils SelectorFamily which is not nice. The reason we do not have any
	// 	//possibility to get to the key definition system, not do we have any atoms for the selectors.
	// 	//therefore we just use normal selectors, which can be augmented to be added to store.
	// 	return (param)=>{
	// 		var nk = `${options.key}__${param}`;
	// 		if(this.store[nk]) return this.store[nk].state;
	// 		var o = Object.assign({},options);
	// 		o.key = nk;
	// 		// @ts-ignore
	// 		o.get = options.get(param);
	// 		if(options.set){
	// 			// @ts-ignore
	// 			o.set = options.set(param);
	// 		}
	//
	// 		// @ts-ignore
	// 		return this.getSelectorFromStore(o,'selectorfamily');
	// 	};
	// }
	getSelectorFromStore<T>(options: ReadOnlySelectorOptions<T>, type:StoreEntryType = 'selector'):RecoilValueReadOnly<T>{
		var initalGetter = options.get;
		// var initalSetter = options.set;
		
		this.store[options.key] = {setter:null, state:null, val:null , type:type };
		
		options.get = ({get})=>{
			
			// @ts-ignore
			var v = initalGetter({get:get});
			this.store[options.key].val = v;
			return v;
		};
		// options.set = ({set,get,reset},val) => {
		// 	initalSetter({set,get,reset},val);
		// 	this.store[options.key].val = val;
		// };
		var el = selector(options);
		this.store[options.key].state = el;
		return el;
	}
	
	
	/**
	 * Returns an AtomEffect that if attached to the Atom will add it to this store.
	 * In theory you can have multiple stores each having it's own AtomEffect, however they might itnerfere.
	 * @param defaultValue
	 */
	getInitEffect<T>(defaultValue:T,type:StoreEntryType):AtomEffect<T>{
		return ({node,onSet,setSelf})=>{
			//will be called on init
			if(this.store[node.key]) return; //already initialized ignore, should never happen.
			this.log(`Adding To Connected Store ${node.key}`);
			
			//if we have a value for this atom, we will use it, otherwise the default value with which it was initialized.
			defaultValue = this.preInitValues[node.key] || defaultValue;
			this.store[node.key] = {state: node, setter: setSelf, val:defaultValue, type:type};
			
			if(this.preInitValues[node.key])
				setSelf(this.preInitValues[node.key]);
			
			delete(this.preInitValues[node.key]); //value is now stored in store, we don't need to cache pre-init values.
			
			onSet((v)=>{
				this.store[node.key].val = v;
				if(this.enableLogging)
					console.log(`Value of ${node.key} set to ${JSON.stringify(v)}`);
			});
			
			
		};
	}
	
	/**
	 * Retrieves the (stored) value of recoil state
	 * @param rs
	 */
	get<T>(a:RecoilState<T>|RecoilValueReadOnly<T>):T|null{
		
        //Return the default value if nothing has been set yet.
		
		var se = this.getStoreEntry(a);
		var key = this.getStoreEntryKey(a);
		if (se) return se.val;
		if (this.preInitValues[key]) return this.preInitValues[key]
		return null;
	}
	
	getStoreEntryKey<T>(a:RecoilState<T>|RecoilValueReadOnly<T>):string{
		return a.key.replace('__withFallback','');
	}
    
	getStoreEntry<T>(a:RecoilState<T>|RecoilValueReadOnly<T>):StoreEntry<T>|null{
		//For some internal Recoil reasons keys that atoms get when initialized in atomEffects get a __withFallback
		return this.store[a.key.replace('__withFallback','')];
	}
	
	/**
	 * Sets the value of a recoilstate
	 * This will not work for selector or selectorFamily types yet. This is a todo.
	 * @param rs
	 * @param newValue
	 */
	set<T>(a:RecoilState<T>,newVal:T){
		var se = this.getStoreEntry(a);
		var key = this.getStoreEntryKey(a);
		if (!se){
			//Updating a recoil state before it has been added to the Store, it might be that update is called before any components
			//started using this state, that is fine.
			//we simply store the value until the first time someone uses useConnectedValue hook, to actually access the atom
			//and will overwrite it's value
			this.log(`Caching value for ${key}: ${JSON.stringify(newVal)}`);
			this.preInitValues[key] = newVal;
			
		}else {
			
			
			if(se.setter){
				this.log('Updating value of ' + key)
				se.val = newVal;
				se.setter(newVal);
			}else{
				if(se.type == 'selector' || se.type == 'selectorfamily'){
					throw new Error('Connected Store does not support setting selectors fully at this point. Please see comment in ConnectedStore.set function on solutins');
					//Selectors do not have effects, so the only way how to get setter-function for Selectors from Recoil at this moment
					//is to rely on the the calling of the useRecoilState hooks, these are wrapped by the hooks in state-hooks.
					//however this poses a problem if a selector is changed before it is used. in theory it is easy to cache these values.
					//however this creates an inconsistent state.
					//For now we simply don't need it yet, but it might be implemented at a later point.
				}
				this.log(`Failed attempt to change element with key ${key} to ${newVal}. It does not have a setter function defined. It might be a selector that does not allow being set. `)
			}
		}
	}
	
	log(msg:string) {
		if(!this.enableLogging) return;
		console.log('[Connected Store] ' + msg);
	}
	
	
	/**
	 * This function is used by state-hooks.ts hooks, that wrap the recoil-standard hooks.
	 * For Atoms and AtomFamilys this is not necessary since recoil 0.1.1 - for selectors it is still needed, but is not implemented.
	 * Therefore this function doesn't do anything at the moment.
	 * @param rs
	 * @param setter
	 */
	addRecoilState<T>(rs: RecoilState<T>, setter:SetterOrUpdater<T>) {
		
		//After introducing atom Effects in recoil 0.1.1 we do not need this function anymore for atoms.
		
		//We still use it for selectors. The set function will throw an error however if a setter without a set-function is trying to be set.
		
		var se = this.getStoreEntry(rs);
		if(se && !se.setter && (se.type == 'selector' || se.type == 'selectorfamily') ){
			se.setter = setter;
		}
		
		//The code below is just for reference, it can probably be deleted, once selector-setters are fully implemented.
		// 	if(this.store[rs.key]) return; //already initialized ignore
		// 	this.log(`Adding To Connected Store ${rs.key}`);
		// 	this.store[rs.key] = {state: rs, setter: setter};
		// 	if(this.preInitValues[rs.key]){
		// 		this.log(`Setting Value to new added State: ${this.preInitValues[rs.key]}`);
		// 		//Someone modified this state, we need to update the value of the atom, with the old value
		// 		//However we cannot do it in the current rendering process - so we need to have a minimum wait time
		// 		//to do it after re-render.
		// 		setTimeout(()=>{
		// 			var ov = this.preInitValues[rs.key];
		// 			delete(this.preInitValues[rs.key]); //value is now stored in atom, we don't need to cache it.
		// 			setter(ov)
		// 		},1)
		// 	}
	}
}

export const connectedStore: ConnectedStore = new ConnectedStore();

/**
 * Central function for updating a ConnectedState Atom or Selector
 * @param state An atom or selector created via connectedAtom or connectedSelector
 * @param val The new value of the state.
 * @see connectedAtom
 * @see connectedSelector
 */
export function updateConnectedValue<T>(state: ConnectedState<T>, val: T) {
	connectedStore.set(state, val);
}

/**
 * Function for getting the connected value inside the store.
 * This might fail for selectors and selectorFamilies if they are not intialized yet.
 * @param state
 */
export function getConnectedValue<T>(state: ConnectedState<T>|RecoilValueReadOnly<T>) {
	return connectedStore.get(state);
}

/**
 * We use wrappers for atom,selecter and atomFamily, mostly to clarify what is what state.
 * And maybe for future reference.
 */

export type ConnectedState<T> = RecoilState<T>;

export function connectedAtom<T>(options: AtomOptions<T>): ConnectedState<T> { return connectedStore.getAtomFromStore(options); }
// @ts-ignore
export function connectedAtomFamily<T, P>(options: AtomFamilyOptions<T, P>): (param: P) => ConnectedState<T>{ return connectedStore.getAtomFamilyFromStore(options);}

export function connectedSelector<T>(options: ReadOnlySelectorOptions<T>):RecoilValueReadOnly<T> {
	return connectedStore.getSelectorFromStore(options);
}

// @ts-ignore
// export function connectedSelectorFamily<T,P>(options: ReadWriteSelectorFamilyOptions<T,P>): (param: P) => ConnectedState<T> {
// 	return connectedStore.getSelectorFamilyFromStore<T,P>(options);
// }